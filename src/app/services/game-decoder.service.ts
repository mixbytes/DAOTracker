import { Injectable } from '@angular/core'
import { Serialize } from 'eosjs'
import { TextEncoder, TextDecoder } from 'text-encoding'
import { environment } from '../../environments/environment';
import { GAME_FAILED, GAME_FINISHED, GAME_MESSAGE, GAME_STARTED } from './eos.abi'
import { EosService } from './eos.service'
import { LoggerService } from './logger.service'

export enum PlatformEventType {
    GameStarted = 0,
    GameFinished = 4,
    GameFailed = 5,
    GameMessage = 6,
}

export const GameEventTypeMap = {
    [PlatformEventType.GameStarted]: 'Game started',
    [PlatformEventType.GameFinished]: 'Game finished',
    [PlatformEventType.GameFailed]: 'Game failed',
    [PlatformEventType.GameMessage]: 'Game message',
}

export interface PlatformEventPayload {
    sender: string
    casino_id: number
    event_type: number
    game_id: number
    req_id: number
    data: string
}

@Injectable({ providedIn: 'root' })
export class GameDecoderService {
    private eventAbis = new Map<PlatformEventType, Map<string, Serialize.Type>>()
    private builtinTypes = Serialize.createInitialTypes()
    private abiMap = {
        [PlatformEventType.GameStarted]: GAME_STARTED,
        [PlatformEventType.GameFinished]: GAME_FINISHED,
        [PlatformEventType.GameFailed]: GAME_FAILED,
        [PlatformEventType.GameMessage]: GAME_MESSAGE,
    }

    constructor(
        private eos: EosService,
        private logger: LoggerService
    ) {
        for (const [etype, abi] of Object.entries(this.abiMap)) {
            this.eventAbis.set(Number(etype), Serialize.getTypesFromAbi(this.builtinTypes, abi))
        }
    }

    private readMsg(msg: string) {
        const buf = Buffer.from(msg, 'hex')
        const len = buf.readUInt8(0)
        const data: number[] = []
        for (let i = 0; i < len; i++) data.push(buf.readUInt32LE(1 + i * 8))
        return data
    }

    public deserializeEvent(payload: PlatformEventPayload) {
        const textEncoder = new TextEncoder()
        const textDecoder = new TextDecoder()
        const eventType = this.eventAbis.get(payload.event_type)?.get('event_data')
        if (!eventType) throw new Error('Unknown event type')
        const buffer = new Serialize.SerialBuffer({
            textEncoder,
            textDecoder,
            array: Serialize.hexToUint8Array(payload.data),
        })
        const data = eventType.deserialize(buffer)
        if (data.msg) data.msg = this.readMsg(data.msg)
        return data
    }

    public async casinoById(id: number) {
        const result = await this.eos.api.rpc.get_table_rows({
            limit: 1,
            json: true,
            lower_bound: id,
            table_key: 'id',
            table: 'casino',
            code: environment.platformAcc,
            scope: environment.platformAcc,
        })
        return result?.rows[0]
    }

    public async gameById(id: number) {
        const result = await this.eos.api.rpc.get_table_rows({
            limit: 1,
            json: true,
            lower_bound: id,
            table_key: 'id',
            table: 'game',
            code: environment.platformAcc,
            scope: environment.platformAcc,
        })
        return result?.rows[0]
    }

    public async gameParamsById(casino: string, id: number) {
        const result = await this.eos.api.rpc.get_table_rows({
            limit: 1,
            json: true,
            lower_bound: id,
            table_key: 'game_id',
            table: 'game',
            code: casino,
            scope: casino,
        })
        return result?.rows[0]?.params
    }

    public async playerFromTxid(txid: string) {
        const tx = await this.eos.api.rpc.history_get_transaction(txid)
        // const traces = tx.traces.filter(t => !!t.act.data?.event_type)
        // if (traces.length) console.dir(traces, { depth: 6 })
        return tx.traces[0]?.act?.data?.from
    }
}
