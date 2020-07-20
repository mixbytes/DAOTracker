import { Api, JsonRpc } from 'eosjs';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, from, of, defer, combineLatest, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { Result } from '../models';
import { LoggerService } from './logger.service';
import { TextEncoder, TextDecoder } from 'text-encoding'

@Injectable()
export class EosService {
  // private apiEndpointSource = new BehaviorSubject<string>(environment.blockchainUrl);
  // public apiEndpoint$ = this.apiEndpointSource.asObservable();
  public api: Api;
  public eos: JsonRpc;

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {
    const textEncoder = new TextEncoder()
    const textDecoder = new TextDecoder();
    const rpc = this.eos = new JsonRpc(environment.blockchainUrl, { fetch });
    const signatureProvider = new JsSignatureProvider([]);
    this.api = new Api({ rpc, signatureProvider, textEncoder, textDecoder })
  }

  setApiEndpoint(url: string) {
    // this.apiEndpointSource.next(url);
  }

  // Note: to convert chain promise to cold observable, use defer

  private getResult<T>(source$: Observable<T>): Observable<Result<T>> {
    return source$.pipe(
      map(data => {
        return {
          isError: false,
          value: data
        };
      }),
      catchError(error => {
        this.logger.error('CHAIN_ERROR', error);
        return of({
          isError: true,
          value: error
        });
      })
    );
  }

  getDeferInfo(): Observable<any> {
    return defer(() => from(this.eos.get_info()));
  }

  getDeferBlock(id: string | number): Observable<any> {
    return defer(() => from(this.eos.get_block(id)));
  }

  getDeferAccount(name: string): Observable<any> {
    return defer(() => from(this.eos.get_account(name)));
  }

  getDeferTransaction(id: string): Observable<any> {
    return defer(() => from(this.eos.history_get_transaction(id)));
  }

  getAccountRaw(name: string): Observable<Result<any>> {
    const getAccount$ = defer(() => from(this.eos.get_account(name)));
    return this.getResult<any>(getAccount$);
  }

  getAccountActions(name: string, position = -1, offset = -20): Observable<Result<any[]>> {
    const getAccountActions$ = defer(() => from(this.eos.history_get_actions(
      name,
      position,
      offset
    )));
    return this.getResult<any[]>(getAccountActions$.pipe(
      map((data: any) => data.actions),
      map((actions: any[]) => actions.sort((a, b) => b.account_action_seq - a.account_action_seq))
    ));
  }

  getAccountTokens(name: string): Observable<Result<any[]>> {
    const allTokens$: Observable<any[]> = this.http.get<any[]>(`https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json`);
    const getCurrencyBalance = (token: any, account: string): Observable<any> => {
      return from(this.eos.get_currency_balance(token.account, account, token.symbol)).pipe(
        map((balance: string[]) => ({
          ...token,
          balance: balance[0] ? Number(balance[0].split(' ', 1)) : 0
        })),
        catchError(() => of({
          ...token,
          balance: 0
        }))
      );
    };
    const accountTokens$ = allTokens$.pipe(
      switchMap(tokens => {
        return combineLatest(
          tokens.map(token => getCurrencyBalance(token, name))
        ).pipe(
          map(tokens => tokens.filter(token => token.balance > 0))
        )
      })
    );
    return this.getResult<any[]>(accountTokens$);
  }

  getAbi(name: string): Observable<Result<any>> {
    const getCode$ = defer(() => from(this.api.getAbi(name)));
    return this.getResult<any>(getCode$);
  }

  getBlockRaw(id: string | number): Observable<Result<any>> {
    const getBlock$ = defer(() => from(this.eos.get_block(id)));
    return this.getResult<any>(getBlock$);
  }

  getTransactionRaw(blockId: number, id: string): Observable<Result<any>> {
    const getTransaction$ = defer(() => from(this.eos.history_get_transaction(id, blockId)));
    return this.getResult<any>(getTransaction$);
  }

  getProducers() {
    return from(this.eos.get_table_rows({
      json: true,
      code: "eosio",
      scope: "eosio",
      table: "producers",
      limit: 700,
      table_key: ""
    })).pipe(
      map((result: any) => {
        return result.rows
          .map(row => ({ ...row, total_votes: parseFloat(row.total_votes) }))
          .sort((a, b) => b.total_votes - a.total_votes);
      })
    );
  }

  getChainStatus() {
    return from(this.eos.get_table_rows({
      json: true,
      code: "eosio",
      scope: "eosio",
      table: "global",
      limit: 1
    })).pipe(
      map((result: any) => result.rows[0])
    );
  }
}
