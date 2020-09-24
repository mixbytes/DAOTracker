import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap, share, catchError } from 'rxjs/operators';
import { EosService } from '../../services/eos.service';
import { AppService } from '../../services/app.service';

@Component({
  templateUrl: './producer.component.html',
  styleUrls: ['./producer.component.scss']
})
export class ProducerComponent implements OnInit {

  name$: Observable<string>;
  producer$: Observable<any>;

  constructor(
    private route: ActivatedRoute,
    private eosService: EosService,
    private appService: AppService
  ) { }

  countRewards(total_votes, index, totalProducerVoteWeight, votesToRemove) {
    const position = index;
    let reward = 0;
    const percentageVotesRewarded = total_votes / (totalProducerVoteWeight - votesToRemove) * 100;

    if (position < 22) reward += 443;
    reward += percentageVotesRewarded * 200;
    if (reward < 100) reward = 0;

    return Math.floor(reward).toLocaleString();
  }

  ngOnInit() {
    this.name$ = this.route.params.pipe(
      map(params => params.id)
    );
    this.producer$ = combineLatest(
      this.name$,
      this.eosService.getChainStatus(),
      this.eosService.getProducers(),
      this.name$.pipe(
        switchMap(name => this.eosService.getDeferAccount(name))
      )
    ).pipe(
      map(([name, chainStatus, producers, account]) => {
        const producer = producers.find(producer => producer.owner === name);
        const index = producers.findIndex(producer => producer.owner === name);
        const votesToRemove = producers.reduce((acc, cur) => {
          const percentageVotes = cur.total_votes / chainStatus.total_producer_vote_weight * 100;
          if (percentageVotes * 200 < 100) {
            acc += parseFloat(cur.total_votes);
          }
          return acc;
        }, 0);
        const position = parseInt(index) + 1;
        const reward = this.countRewards(producer.total_votes, index, chainStatus.total_producer_vote_weight, votesToRemove);
        const votes = (producer.total_votes / chainStatus.total_producer_vote_weight * 100).toFixed(2);
        return { ...producer, account, position, reward, votes }
      }),
      switchMap(producer => {
        if (!producer.url) {
          return of(producer);
        } else {
          return this.appService.getBpJson(producer.url).pipe(
            catchError(() => of(null)),
            map(bpJson => ({
              ...producer,
              bpJson,
              location: bpJson && bpJson.nodes && bpJson.nodes[0] && bpJson.nodes[0].location,
              validated: bpJson && bpJson.producer_public_key === producer.producer_key && bpJson.producer_account_name === producer.owner
            }))
          );
        }
      }),
      share()
    );
  }

}
