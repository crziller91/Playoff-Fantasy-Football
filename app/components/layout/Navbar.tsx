import { observer } from "mobx-react-lite";
import { Button, DropdownItem, Navbar, NavbarBrand, Dropdown, Avatar } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";
import { HiMenu, HiOutlineLogin, HiOutlineUserAdd, HiOutlineLogout } from "react-icons/hi";
import { useStore } from "../../stores/StoreContext";
import ResetConfirmationModal from "../modals/ResetConfirmationModal";
import { useSession, signOut } from "next-auth/react";

const NavigationBar = observer(() => {
  const { draftStore } = useStore();
  const [openModal, setOpenModal] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

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

          {isAuthenticated ? (
            <div className="ml-3 flex items-center gap-4">
              <Dropdown
                arrowIcon={false}
                inline
                label={
                  session.user?.image ? (
                    <Avatar img={session.user.image} rounded size="sm" />
                  ) : (
                    <div className="flex size-8 items-center justify-center rounded-full bg-blue-500 text-white">
                      {(session.user?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )
                }
              >
                <DropdownItem as={Link} href="/profile">
                  Profile
                </DropdownItem>
                {/* Only show reset if needed */}
                <DropdownItem onClick={() => setOpenModal(true)}>Reset All</DropdownItem>
                <DropdownItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <div className="flex items-center gap-2">
                    <HiOutlineLogout />
                    <span>Sign out</span>
                  </div>
                </DropdownItem>
              </Dropdown>
            </div>
          ) : (
            <Button
              as={Link}
              href="/auth/signin"
              color="light"
            >
              <HiOutlineLogin className="mr-1 size-5" />
              Sign In
            </Button>
          )}
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