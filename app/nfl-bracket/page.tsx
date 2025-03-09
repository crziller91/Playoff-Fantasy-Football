import { Flowbite } from "flowbite-react";
import NavigationBar from "../components/Navbar";

export default function NFLBracket() {
  return (
    <Flowbite>
      <NavigationBar />
      <main className="min-h-screen w-full p-4">
        <h1 className="mt-6 text-center text-3xl font-bold text-blue-600">
          NFL Bracket
        </h1>
      </main>
    </Flowbite>
  );
}
