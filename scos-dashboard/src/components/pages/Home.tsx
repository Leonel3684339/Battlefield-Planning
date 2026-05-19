export function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Stochastic Correlated Obstacle Scene</h1>
      <p className="text-xl text-[#b0a080]">
        A tactical decision aid for military obstacle planning.
      </p>
      <div className="military-card">
        <h2 className="text-2xl font-semibold mb-4">Mission</h2>
        <p>
          SCOS integrates AI‑based obstacle generation with US Army doctrine to
          assist planners in creating effective obstacle plans. Use the Map
          Planner to design your battlefield.
        </p>
      </div>
    </div>
  );
}