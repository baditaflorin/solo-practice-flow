import { PracticeApp } from "./features/practice/PracticeApp";

function App() {
  return <PracticeApp version={__APP_VERSION__} commit={__COMMIT_SHA__} />;
}

export default App;
