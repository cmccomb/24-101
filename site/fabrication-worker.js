import {parseGCode, parseDXF} from './fabrication.js?v=1.4.2';

self.onmessage = ({data}) => {
  try {
    const job = data.kind === 'printer' ? parseGCode(data.text) : parseDXF(data.text);
    self.postMessage({job});
  } catch (error) {
    self.postMessage({error: error.message});
  }
};
