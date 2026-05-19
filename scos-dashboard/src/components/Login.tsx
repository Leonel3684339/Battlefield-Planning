import { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onLogin();
    } else {
      setError('Please enter both username and password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#2e3b2e]">
      <div className="bg-[#3f4f3f] p-8 rounded-lg shadow-2xl w-96 border border-[#5a5a3e]">
        <h2 className="text-2xl font-bold text-[#e0e0c0] mb-6 text-center">Tactical Obstacle Planner</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#b0a080] mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-[#2e3b2e] border border-[#5a5a3e] rounded text-[#e0e0c0] focus:outline-none focus:border-[#8b7d6b]"
            />
          </div>
          <div>
            <label className="block text-[#b0a080] mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#2e3b2e] border border-[#5a5a3e] rounded text-[#e0e0c0] focus:outline-none focus:border-[#8b7d6b]"
            />
          </div>
          {error && <p className="text-[#8b3a3a] text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#4b5320] hover:bg-[#3a4018] text-[#e0e0c0] font-semibold py-2 px-4 rounded transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}