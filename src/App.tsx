import { useEffect, useState } from "react";
import { PracticeApp } from "./features/practice/PracticeApp";

const latestCommitUrl =
  "https://api.github.com/repos/baditaflorin/solo-practice-flow/commits/main";

function App() {
  const [commit, setCommit] = useState(__COMMIT_SHA__);

  useEffect(() => {
    let cancelled = false;

    fetch(latestCommitUrl, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { sha?: string } | null) => {
        if (!cancelled && payload?.sha) {
          setCommit(payload.sha.slice(0, 7));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return <PracticeApp version={__APP_VERSION__} commit={commit} />;
}

export default App;
