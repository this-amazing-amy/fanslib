import { useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { shootsCollection } from "~/lib/collections/shoots";
import { generateTempId } from "~/lib/utils";

const TestPage = () => {

  const createShoot = () => {
    shootsCollection.insert({
      id: generateTempId(),
      name: 'Test Shoot' + Math.floor(Math.random() * 1000),
      shootDate: new Date(),
      description: 'This is a test shoot',
    })
  }

  const {data} = useLiveQuery(q => q.from({ shoots: shootsCollection}))

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      {data?.map(shoot => (
        <div key={shoot.id} className="mb-2 p-2 border rounded">
          <h2 className="text-xl font-semibold">{shoot.name}</h2>
          <p className="text-gray-600">{shoot.description}</p>
          <p className="text-sm text-gray-500">
            Shoot Date: {shoot.shootDate?.toISOString()}
          </p>
        </div>
      ))}
      <button onClick={createShoot} className="btn btn-primary mt-4">Create Shoot</button>
    </div>
  );
}

export const Route = createFileRoute('/test')({
  component: TestPage,
});
