import { Context, transferCoins, Address, generateEvent, Storage, balance, transferredCoins } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes  } from '@massalabs/as-types';

export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!Context.isDeployingContract()) return;
  Storage.set("f", "0")
  Storage.set("fc", "0")
}

export function paiement(_args: StaticArray<u8>): void {
    generateEvent("Debug:" + " f:" + Storage.get("f") + " || fc:" + Storage.get("fc"));
    let args = new Args(_args);
    let receivedAmount = Context.transferredCoins();
    const caller = Context.caller().toString();

    //récupérer l'adresse des producteurs et le montant pour chacun
    const params = args.nextString().expect('Missing name argument.');
    const parts = params.split("-");
    const addressArray: Array<string> = new Array<string>();
    const amountArray: Array<f64> = new Array<f64>();
    for (let i = 0; i < parts.length; i++) {
      const subparts = parts[i].split("_");
      const address = subparts[0];
      const amount = f64.parse(subparts[1]);
      addressArray.push(address);
      amountArray.push(amount);
    }

    //effectuer le transfert à chaque producteur
    generateEvent("Debug: ------- producteur --------")
    let recap_str: string = "";
    for (let i = 0; i < addressArray.length; i++) {
        const producer_address = addressArray[i]
        const amount = amountArray[i] * 1000000000

        const amountToTransfer: u64 = <u64>amount;
        transferCoins(new Address(producer_address), amountToTransfer);
        let last_facture_producer_id: string = Storage.get('f');
        let new_facture_producer_id: number = parseInt(last_facture_producer_id, 10) + 1;
        let new_facture_producer_id_string: string= "f" + new_facture_producer_id.toString();
        new_facture_producer_id_string = new_facture_producer_id_string.slice(0, -2);
        let value: string = (amount/1000000000).toString() + "_" + caller;

        if (Storage.has(producer_address)) {
            Storage.append(producer_address, new_facture_producer_id_string);
            generateEvent("Debug: " + producer_address + " producer address exists.");
        }
        if (!Storage.has(producer_address)) {
            Storage.set(producer_address, new_facture_producer_id_string);
            generateEvent("Debug: " + producer_address + " producer address doesn't exist.");
        }

        Storage.set(new_facture_producer_id_string, value);
        Storage.set("f", new_facture_producer_id.toString().slice(0, -2));

        generateEvent("Debug: Storage.get("+new_facture_producer_id_string+")=" + Storage.get(new_facture_producer_id_string));
        generateEvent("Debug: Storage.get("+producer_address+")=" + Storage.get(producer_address));
        recap_str += (amount/1000000000).toString() + "_" + producer_address;
        recap_str += "-"
    }

    recap_str = recap_str.slice(0, -1);

    //save the Client order
    generateEvent("Debug: ------- client --------")
    let last_facture_client_id: string = Storage.get('fc');
    let new_facture_client_id: number = parseInt(last_facture_client_id, 10) + 1;
    let new_facture_client_id_string: string= "fc" + new_facture_client_id.toString();
    new_facture_client_id_string = new_facture_client_id_string.slice(0, -2);

    if (Storage.has(caller)) {
            Storage.append(caller, new_facture_client_id_string);
            generateEvent("Debug: " + caller + " client address exists.");
        }
    if (!Storage.has(caller)) {
            Storage.set(caller, new_facture_client_id_string);
            generateEvent("Debug: " + caller + " client address doesn't exist.");
        }
    Storage.set(new_facture_client_id_string, recap_str);
    Storage.set("fc", new_facture_client_id.toString().slice(0, -2));

    generateEvent("Debug: Storage.get("+new_facture_client_id_string+")=" + Storage.get(new_facture_client_id_string));
    generateEvent("Debug: Storage.get("+caller+")=" + Storage.get(caller));
    generateEvent(recap_str);
}

export function getKey(_args: StaticArray<u8>): StaticArray<u8> {
  let args = new Args(_args);
  let key = args.nextString().expect('Missing name argument.');
  const data = Storage.get(key)
  return stringToBytes(data);
}
