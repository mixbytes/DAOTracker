import { Component, OnInit, Input } from '@angular/core';
import { Serialize } from 'eosjs';
import { SPONSORSHIP_EXT } from '../../../services/eos.abi'
import { EosService } from '../../../services/eos.service';

@Component({
  selector: 'app-transaction-information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.scss']
})
export class InformationComponent implements OnInit {

  @Input() transaction;

  constructor(private eosService: EosService) { }

  ngOnInit() {
    for (const { type, data } of this.transaction.trx.trx.transaction_extensions) {
      if (type !== 0) continue;
      const sponsorType = Serialize.getTypesFromAbi(this.eosService.api.abiTypes, SPONSORSHIP_EXT).get('sponsor_ext');
      let buffer = new Serialize.SerialBuffer({
        array: Serialize.hexToUint8Array(data)
      });
      const { sponsor } = sponsorType.deserialize(buffer)
      this.transaction.sponsored_by = sponsor
    }
  }

}
