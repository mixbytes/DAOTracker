import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { EosService } from '../../services/eos.service';
import { Observable, of, timer } from 'rxjs';
import { map, share, switchMap, mergeMap } from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import { EOSGlobalTableRow, EOSGlobalTable } from '../../interfaces/eos.global.table';

@Component({
  templateUrl: './producers.component.html',
  styleUrls: ['./producers.component.scss']
})
export class ProducersComponent implements OnInit {

  columnHeaders$: Observable<string[]> = of(PRODUCERS_COLUMNS);
  producers$: Observable<any[]>;
  chainStatus$: Observable<any>;
  private EOSGlobalTable: EOSGlobalTable;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private eosService: EosService
  ) { }

  async getGlobalTableContent(): Promise<EOSGlobalTableRow> {
    let table = this.EOSGlobalTable;
    if (!table) {
      table = await this.eosService.eos.get_table_rows({
        json: true,
        code: 'eosio',
        scope: 'eosio',
        table: 'global'
      });
    }
    return table && table.rows && table.rows.length ? table.rows[0] : null;
  }

  async countActiveProducers() {
    const globalTable = await this.getGlobalTableContent();
    return globalTable.target_producer_schedule_size || 21;
  }

  async countRewards(total_votes, index, totalProducerVoteWeight, votesToRemove) {
    let reward = 0;
    const position = index;
    const percentageVotesRewarded = total_votes / (totalProducerVoteWeight - votesToRemove) * 100;

    if (position < await this.countActiveProducers()) { reward += 443; }
    reward += percentageVotesRewarded * 200;
    if (reward < 100) { reward = 0; }

    return Math.floor(reward);
  }

  ngOnInit() {
    this.columnHeaders$ = this.breakpointObserver.observe(Breakpoints.XSmall).pipe(
      map(result => result.matches ? PRODUCERS_COLUMNS.filter((c: any) => (c !== 'url' && c !== 'numVotes')) : PRODUCERS_COLUMNS)
    );
    this.chainStatus$ = timer(0, 60000).pipe(
      switchMap(() => this.eosService.getChainStatus()),
      share()
    );
    this.producers$ = this.chainStatus$.pipe(
      switchMap(chainStatus => this.eosService.getProducers().pipe(
        mergeMap(async producers => {
          const votesToRemove = producers.reduce((acc, cur) => {
            const percentageVotes = cur.total_votes / chainStatus.total_producer_vote_weight * 100;
            if (percentageVotes * 200 < 100) { acc += parseFloat(cur.total_votes); }
            return acc;
          }, 0);
          const activeCount = await this.countActiveProducers();
          return producers
              .sort((producerA, producerB) => {
                const activeA = parseInt(producerA.is_active, 10);
                const activeB = parseInt(producerB.is_active, 10);
                return activeA === activeB
                    ? 0
                    : activeA > activeB
                      ? -1
                      : 1;
              })
              .map((producer, index) => {
            let reward = 0;
            const position = parseInt(index, 10) + 1;
            console.log(producer.owner, producer.is_active, position);
            const active = producer.is_active && position <= activeCount;
            const numVotes = (producer.total_votes / this.calculateVoteWeight() / 10000).toFixed(0);
            const votes = (producer.total_votes / chainStatus.total_producer_vote_weight * 100).toFixed(2);

            if (environment.token === 'TLOS') {
              if (position < 22) {
                reward = 900;
              } else if (position < 52) {
                reward = 400;
              }
            } else {
              reward = this.countRewards(
                producer.total_votes,
                index,
                chainStatus.total_producer_vote_weight,
                votesToRemove
              ) as any;
            }

            return { ...producer, position, reward, votes, numVotes, active };
          });
        })
      )),
      share()
    );
  }

  private calculateVoteWeight() {
    // time epoch:
    // https://github.com/EOSIO/eos/blob/master/contracts/eosiolib/time.hpp#L160
    // stake to vote
    // https://github.com/EOSIO/eos/blob/master/contracts/eosio.system/voting.cpp#L105-L109
    const timestamp_epoch = 946684800000;
    const dates_: number = (Date.now() / 1000) - (timestamp_epoch / 1000);
    const weight_: number = Math.floor(dates_ / (86400 * 7)) / 52;  // 86400 = seconds per day 24*3600
    return Math.pow(2, weight_);
  }

}

export const PRODUCERS_COLUMNS = [
  'position',
  'owner',
  'url',
  'numVotes',
  'votes',
  'reward'
];
