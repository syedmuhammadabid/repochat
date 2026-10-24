import { useState } from 'react';
import RepoLoader from './components/RepoLoader.jsx';
import Chat from './components/Chat.jsx';

export default function App() {
  const [repo, setRepo] = useState(null); // { repo, files, sections, truncated }
  return (
    <main>
      <h1>RepoChat</h1>
      <p className="sub">Paste a GitHub repo. Ask questions. Every answer cites the exact docs section.</p>
      <RepoLoader onLoaded={setRepo} />
      {repo && <Chat key={repo.repo} repo={repo} />}
    </main>
  );
}
