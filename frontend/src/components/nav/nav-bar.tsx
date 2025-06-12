'use client';

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { ThemeToggle } from "components/functions/theme-toggle";
import { UserAvatar } from "../../components/profile/user-avatar";
import { useAuth } from "../../contexts/auth-context";
import { Plus, Menu, Flame } from "lucide-react";
import { AuthModals } from "components/modals/auth-modals";
import { CreatePostModal } from "components/modals/create-post-modal";
import { Avatar, AvatarImage } from "../../components/ui/avatar";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import type { Post } from "../../types/post";
import type { PostCarouselRef } from "../../components/posts/post-carousel";

// Add props interface for NavBar
interface NavBarProps {
  postCarouselRef?: React.RefObject<PostCarouselRef | null>;
}

export function NavBar({ postCarouselRef }: NavBarProps) {
  const { user, loading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Function to handle post creation from NavBar
  const handlePostCreatedFromNav = (newPost: Post) => {
    if (postCarouselRef?.current?.handlePostCreated) {
      postCarouselRef.current.handlePostCreated(newPost);
    }
  };
  
  const NavContent = () => (
    <>
      <ThemeToggle />
      {loading ? (
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      ) : user ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreatePostOpen(true)}
            className="relative overflow-hidden group border-orange-500/20 hover:border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10"
          >
            <span className="relative z-10 flex items-center justify-center w-full">
              <Plus className="h-4 w-4 mr-2 text-orange-500" />
              Create Post
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"
              initial={{ x: "-100%" }}
              whileHover={{ x: "0%" }}
              transition={{ duration: 0.3 }}
            />
          </Button>
          <UserAvatar user={user} />
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setIsLoginOpen(true)}>
            Sign In
          </Button>
          <Button onClick={() => setIsSignupOpen(true)}>
            Get Started
          </Button>
        </div>
      )}
    </>
  );

  const MobileNavContent = () => (
    <div className="py-1">
      <DropdownMenuItem asChild className="justify-center p-2">
        <div className="flex justify-center w-full">
          <ThemeToggle /> 
        </div>
      </DropdownMenuItem>
      {loading ? (
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted mx-auto my-1" />
      ) : user ? (
        <>
          <DropdownMenuItem
            onClick={() => setIsCreatePostOpen(true)}
            className="flex items-center justify-center gap-2 p-2"
          >
            <Plus className="h-4 w-4 text-orange-500" />
            Create Post
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="justify-center p-2">
            <span className="flex items-center justify-center gap-2">
              <UserAvatar user={user} /> 
            </span>
          </DropdownMenuItem>
        </>
      ) : (
        <>
          <DropdownMenuItem onClick={() => setIsLoginOpen(true)} className="justify-center p-2">
            Sign In
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsSignupOpen(true)} className="justify-center p-2">
            Get Started
          </DropdownMenuItem>
        </>
      )}
    </div>
  );

  return (
    <>
      <header className={`sticky top-0 z-50 w-full border-b ${user ? 'bg-gradient-to-r from-orange-950/5 via-background/95 to-orange-950/5 backdrop-blur supports-[backdrop-filter]:bg-background/60' : 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'} flex justify-center items-center relative`}>
        {user && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.1),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_50%,rgba(249,115,22,0.05),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,rgba(249,115,22,0.05),transparent_70%)]" />
          </>
        )}
        <div className="container flex h-16 items-center justify-between px-4 relative">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src='/bruinhottake.png' />
            </Avatar>
            <span className={`text-xl font-bold ${user ? 'bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent' : ''}`}>
              Bruin Hot Take
            </span>
            {user && (
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [-5, 5, -5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Flame className="h-5 w-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              </motion.div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <NavContent />
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <MobileNavContent />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <AuthModals
        isLoginOpen={isLoginOpen}
        isSignupOpen={isSignupOpen}
        onLoginClose={() => setIsLoginOpen(false)}
        onSignupClose={() => setIsSignupOpen(false)}
        onSignupOpen={() => setIsSignupOpen(true)}
        onLoginOpen={() => setIsLoginOpen(true)}
      />

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={handlePostCreatedFromNav}
      />
    </>
  );
}