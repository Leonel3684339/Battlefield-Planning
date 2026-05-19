import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/map', label: 'Map Planner', icon: '🗺️' },
  { path: '/doctrine', label: 'Doctrine', icon: '📚' },
  { path: '/simulation', label: 'Simulation', icon: '⚙️' },
  { path: '/bayesian', label: 'Bayesian', icon: '📊' },
  { path: '/rlpolicy', label: 'RL Policy', icon: '🤖' },
];

export function Navbar() {
  return (
    <nav className="bg-[#3f4f3f] border-b border-[#5a5a3e] px-6 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-[#4b5320] rounded-lg"></div>
        <span className="text-xl font-bold text-[#e0e0c0]">SCOS</span>
        <span className="text-xs font-mono text-[#b0a080] ml-2">v2.0</span>
      </div>
      <div className="flex space-x-6">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-3 py-2 rounded transition flex items-center space-x-1 ${
                isActive
                  ? 'bg-[#4b5320] text-[#e0e0c0]'
                  : 'text-[#b0a080] hover:bg-[#4b5320] hover:text-[#e0e0c0]'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}