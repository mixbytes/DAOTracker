import { Component, OnInit, Input } from '@angular/core';
import { Serialize } from 'eosjs';
import { SPONSORSHIP_EXT } from '../../../services/eos.abi'
import { EosService } from '../../../services/eos.service';
import { GameDecoderService, GameEventTypeMap, PlatformEventType } from '../../../services/game-decoder.service';

@Component({
  selector: 'app-transaction-information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.scss']
})
export class InformationComponent implements OnInit {

  @Input() transaction;

  constructor(
      private eosService: EosService,
      private gameDecoder: GameDecoderService,
  ) { }

  async ngOnInit() {
    for (const { type, data } of this.transaction.trx.trx.transaction_extensions) {
      if (type !== 0) continue;
      const sponsorType = Serialize.getTypesFromAbi(this.eosService.api.abiTypes, SPONSORSHIP_EXT).get('sponsor_ext');
      let buffer = new Serialize.SerialBuffer({
        array: Serialize.hexToUint8Array(data)
      });
      const { sponsor } = sponsorType.deserialize(buffer)
      this.transaction.sponsored_by = sponsor
    }
    (window as any).decoder = this.gameDecoder
    const newgame = this.transaction.traces.find(t => t.act.name === 'newgame')
    if (newgame) {
      const bet = this.transaction.traces.find(t => t.act.name === 'transfer')?.act.data.quantity
      const contract = newgame.act.account
      const session = newgame.act.data.req_id
      const casino = this.transaction.traces[0]?.act?.authorization[0]?.permission
      this.transaction.game = { contract, casino, session, bet }
    }
    const gameAction = this.transaction.traces.find(t => t.act.data?.event_type in PlatformEventType)
    if (gameAction) {
      const act = gameAction.act
      const payload = act.data
      const decoded = this.gameDecoder.deserializeEvent(payload)
      if (!decoded) return
      const casino = (await this.gameDecoder.casinoById(payload.casino_id))?.contract
      this.transaction.game = {
        casino,
        contract: payload.sender,
        session: payload.req_id,
        event: GameEventTypeMap[payload.event_type],
        win_amount: decoded.player_win_amount,
        data: payload.data ? JSON.stringify(decoded, null, 2) : undefined
      }
      console.log({ act, payload, decoded })
    }
  }
}
