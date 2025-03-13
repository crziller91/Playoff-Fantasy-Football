import { Button, Navbar, NavbarBrand, NavbarToggle } from "flowbite-react";
import Link from "next/link";

export default function NavigationBar() {
  return (
    <Navbar
      fluid
      className="sticky top-0 z-50 border-b-[1px] border-gray-300 bg-gray-100 py-4" // Thicker navbar with underline and padding
    >
      <NavbarBrand as={Link} href="/" className="px-1">
        <span className="self-center whitespace-nowrap text-2xl font-semibold">
          Playoff Fantasy Football 2026
        </span>
      </NavbarBrand>
      <div className="flex items-center space-x-2 md:order-2">
        <Button as={Link} href="/" color="blue">
          Draft Board
        </Button>
        <Button
          as={Link}
          href="https://www.nfl.com/playoffs/bracket/"
          color="blue"
          target="_blank"
          rel="noopener noreferrer"
        >
          NFL Bracket
        </Button>
        <NavbarToggle className="md:hidden" />
      </div>
    </Navbar>
  );
}
