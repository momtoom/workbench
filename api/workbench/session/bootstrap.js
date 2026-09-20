import { handleWorkbenchCoreRequest } from '../../../server/workbenchCoreApi.js';

export default function handler(request, response) {
  void handleWorkbenchCoreRequest(request, response, 'bootstrap');
}
