import { observer } from "mobx-react-lite";
import { Button, DropdownItem, Navbar, NavbarBrand, Dropdown } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";
import { HiMenu } from "react-icons/hi";
import { useStore } from "../../stores/StoreContext";
import ResetConfirmationModal from "../modals/ResetConfirmationModal";

const NavigationBar = observer(() => {
  const { draftStore } = useStore();
  const [openModal, setOpenModal] = useState(false);

  const handleResetConfirm = () => {
    draftStore.resetDraft();
    setOpenModal(false);
  };

  return (
    <Navbar
      fluid
      className="sticky top-0 z-50 border-b border-gray-300 bg-gray-100 py-4"
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
            color="info"
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
      <ResetConfirmationModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onConfirm={handleResetConfirm}
      />
    </Navbar>
  );
});

export default NavigationBar;