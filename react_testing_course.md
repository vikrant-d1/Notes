## Testing Library Resources

- [Writing Tests with userEvent](https://testing-library.com/docs/user-event/intro/#writing-tests-with-userevent)
- [React Testing Library Documentation](https://testing-library.com/)
  
<img width="2800" height="1370" alt="image" src="https://github.com/user-attachments/assets/2b1ef90e-03c2-4d82-ba6a-caaab6ada614" />
<img width="2924" height="1076" alt="image" src="https://github.com/user-attachments/assets/86718096-5163-46f6-abff-1d7320d850b4" />

```javascript
// import react-testing methods
import {render, screen} from '@testing-library/react'
// userEvent library simulates user interactions by dispatching the events that would happen if the interaction took place in a browser.
import userEvent from '@testing-library/user-event'
// add custom jest matchers from jest-dom
import '@testing-library/jest-dom'
// the component to test
import Fetch from './fetch'

test('loads and displays greeting', async () => {
  // Render a React element into the DOM
  render(<Fetch url="/greeting" />)

  await userEvent.click(screen.getByText('Load Greeting'))
  // wait before throwing an error if it cannot find an element
  await screen.findByRole('heading')

  // assert that the alert message is correct using
  // toHaveTextContent, a custom matcher from jest-dom.
  expect(screen.getByRole('heading')).toHaveTextContent('hello there')
  expect(screen.getByRole('button')).toBeDisabled()
})
```

