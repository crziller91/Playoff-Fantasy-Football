import { Avatar, DropdownDivider, Button, DropdownHeader, DropdownItem, Modal, Navbar, NavbarBrand, Dropdown } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";
import { HiOutlineExclamationCircle, HiMenu } from "react-icons/hi";

interface NavigationBarProps {
  onResetBoard?: () => void;
}

export default function NavigationBar({ onResetBoard }: NavigationBarProps) {
  const [openModal, setOpenModal] = useState(false);

  const handleResetConfirm = () => {
    if (onResetBoard) {
      onResetBoard();
    }
    setOpenModal(false);
  };

  return (
    <Navbar
      fluid
      // eslint-disable-next-line tailwindcss/no-unnecessary-arbitrary-value
      className="sticky top-0 z-50 border-b-[1px] border-gray-300 bg-gray-100 py-4" // Thicker navbar with underline and padding
    >
      <div className="flex w-full items-center justify-between">
        <NavbarBrand as={Link} href="/" className="px-1">
          <span className="self-center whitespace-nowrap text-2xl font-semibold">
            Playoff Fantasy Football 2026
          </span>
        </NavbarBrand>
        <div className="flex items-center gap-2">
          <Button
            as={Link}
            href="https://www.nfl.com/playoffs/bracket/"
            color="blue"
            target="_blank"
            rel="noopener noreferrer"
          >
            NFL Bracket
          </Button>
          <div className="ml-2">
            <Dropdown
              arrowIcon={false}
              inline
              label={
                <HiMenu className="size-6" />
              }
            >
              <DropdownItem onClick={() => setOpenModal(true)}>Reset All</DropdownItem>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal show={openModal} size="md" onClose={() => setOpenModal(false)} popup>
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to reset everything?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleResetConfirm}>
                Yes, I&apos;m sure
              </Button>
              <Button color="gray" onClick={() => setOpenModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </Navbar>
  );
}
