import { observer } from "mobx-react-lite";
import { Button, DropdownItem, Navbar, NavbarBrand, Dropdown, Avatar } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";
import { HiOutlineChevronLeft, HiOutlineLogin, HiOutlineLogout, HiOutlineTrash } from "react-icons/hi";
import { useStore } from "../../stores/StoreContext";
import ResetConfirmationModal from "../modals/ResetConfirmationModal";
import DeleteAccountModal from "../modals/DeleteAccountModal";
import SignOutModal from "../modals/SignOutModal";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const NavigationBar = observer(() => {
  const router = useRouter();
  const { draftStore } = useStore();
  const [openResetModal, setOpenResetModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openSignOutModal, setOpenSignOutModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const handleResetConfirm = () => {
    draftStore.resetDraft();
    setOpenResetModal(false);
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      // Call the API to delete the account
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      // Sign the user out
      await signOut({ redirect: false });

      // Redirect to home page
      router.push("/");

    } catch (error) {
      console.error("Error deleting account:", error);
      alert("There was a problem deleting your account. Please try again.");
    } finally {
      setIsDeleting(false);
      setOpenDeleteModal(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
      setOpenSignOutModal(false);
    }
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
            <div className="ml-2 flex items-center gap-4">
              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#1a748f] text-white">
                    {(session.user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                }
              >
                {/* Only show reset if needed */}
                <DropdownItem onClick={() => setOpenResetModal(true)}>Reset All</DropdownItem>
                <DropdownItem onClick={() => setOpenSignOutModal(true)}>
                  <div className="flex items-center gap-2">
                    <HiOutlineLogout />
                    <span>Sign out</span>
                  </div>
                </DropdownItem>
                <DropdownItem onClick={() => setOpenDeleteModal(true)}>
                  <div className="flex items-center gap-2 text-red-600">
                    <HiOutlineTrash />
                    <span>Delete Account</span>
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
        isOpen={openResetModal}
        onClose={() => setOpenResetModal(false)}
        onConfirm={handleResetConfirm}
      />

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={openSignOutModal}
        onClose={() => setOpenSignOutModal(false)}
        onConfirm={handleSignOut}
        isLoading={isSigningOut}
      />
    </Navbar>
  );
});

export default NavigationBar;