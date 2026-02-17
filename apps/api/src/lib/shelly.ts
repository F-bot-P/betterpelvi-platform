import axios from 'axios';

export async function shellyOn(shellyUrl: string, relay: number = 0) {
  const url = `${shellyUrl}/relay/${relay}?turn=on`;
  await axios.get(url);
}

export async function shellyOff(shellyUrl: string, relay: number = 0) {
  const url = `${shellyUrl}/relay/${relay}?turn=off`;
  await axios.get(url);
}
