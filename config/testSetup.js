import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

jest.setTimeout(process.env.JEST_TIMEOUT || 5000)
configure({ adapter: new Adapter() })
