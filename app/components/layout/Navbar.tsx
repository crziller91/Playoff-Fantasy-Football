import { observer } from "mobx-react-lite";
import { Button, DropdownItem, Navbar, NavbarBrand, NavbarToggle, NavbarCollapse, Dropdown, Avatar } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";
import { HiOutlineChevronLeft, HiOutlineLogin, HiOutlineLogout, HiOutlineTrash, HiShieldCheck } from "react-icons/hi";
import { BiReset } from "react-icons/bi";
import { MdAdminPanelSettings } from "react-icons/md";
import { useStore } from "../../stores/StoreContext";
import ResetConfirmationModal from "../modals/ResetConfirmationModal";
import DeleteAccountModal from "../modals/DeleteAccountModal";
import SignOutModal from "../modals/SignOutModal";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { usePermissions } from "../../hooks/usePermissions";

const NavigationBar = observer(() => {
  const router = useRouter();
  const { draftStore } = useStore();
  const [openResetModal, setOpenResetModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openSignOutModal, setOpenSignOutModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session, status } = useSession();
  const { canEditScores, isAdmin } = usePermissions(); // Get both permissions
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
      <NavbarBrand as={Link} href="/" className="px-1">
        <span className="self-center whitespace-nowrap text-xl font-semibold md:text-2xl">
          Playoff Fantasy Football 2026
        </span>
      </NavbarBrand>

      <div className="flex items-center gap-3 md:order-2">
        {/* NFL Bracket button - hidden on mobile, shown on desktop */}
        <Button
          as={Link}
          href="https://www.nfl.com/playoffs/bracket/"
          color="info"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex"
        >
          NFL Bracket
        </Button>

        {isAuthenticated ? (
          <>
            {isAdmin && (
              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#1a748f] text-white">
                    {(session.user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                }
              >
                {/* Admin Dashboard link - only for admins */}
                <DropdownItem as={Link} href="/admin/dashboard">
                  <div className="flex items-center gap-2">
                    <MdAdminPanelSettings />
                    <span>Admin Dashboard</span>
                  </div>
                </DropdownItem>

                {/* Permissions management - only for admins */}
                <DropdownItem as={Link} href="/admin/permissions">
                  <div className="flex items-center gap-2">
                    <HiShieldCheck />
                    <span>Manage Permissions</span>
                  </div>
                </DropdownItem>

                {/* Reset All - only for admins */}
                <>
                  <Dropdown.Divider />
                  <DropdownItem onClick={() => setOpenResetModal(true)}>
                    <div className="flex items-center gap-2">
                      <BiReset />
                      <span>Reset All</span>
                    </div>
                  </DropdownItem>
                </>
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
            )}

            {/* Non-admin users get a simpler dropdown */}
            {!isAdmin && (
              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#1a748f] text-white">
                    {(session.user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                }
              >
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
            )}
          </>
        ) : (
          <Button
            as={Link}
            href="/auth/signin"
            color="light"
            className="hidden md:flex"
          >
            <HiOutlineLogin className="mr-1 size-5" />
            Sign In
          </Button>
        )}
        <NavbarToggle />
      </div>

      <NavbarCollapse>
        {/* NFL Bracket button - shown on mobile, hidden on desktop */}
        <Button
          as={Link}
          href="https://www.nfl.com/playoffs/bracket/"
          color="info"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full md:hidden"
        >
          NFL Bracket
        </Button>
        {!isAuthenticated && (
          <Button
            as={Link}
            href="/auth/signin"
            color="light"
            className="mt-2 w-full md:hidden"
          >
            <HiOutlineLogin className="mr-1 size-5" />
            Sign In
          </Button>
        )}
      </NavbarCollapse>

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
        isAdmin={isAdmin}
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