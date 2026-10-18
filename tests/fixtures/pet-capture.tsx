import { createRoot } from 'react-dom/client'
import { AppContext } from '../../src/appContext'
import type { AppApi } from '../../src/appContext'
import { PetCapture } from '../../src/views/PetCapture'
import '../../src/index.css'

const noop = () => {}
const api: AppApi = {
  view: { name: 'petCapture' }, navigate: noop,
  devices: [], addDevice: noop, removeDevice: noop,
  pets: [], addPet: async () => {}, updatePet: async () => {}, removePet: async () => {}, updateDevice: noop, account: null,
  signIn: noop, updateAccount: noop, signOut: noop,
}
createRoot(document.getElementById('root')!).render(
  <AppContext.Provider value={api}>
    <div className="app-shell relative flex flex-col"><PetCapture /></div>
  </AppContext.Provider>,
)
