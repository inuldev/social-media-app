"use client";

import Image from "next/image";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, PenLine, X, Upload, Save, Loader2 } from "lucide-react";

import {
  updateUserCoverPhoto,
  updateUserProfile,
} from "@/service/user.service";
import userStore from "@/store/userStore";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProfileHeader = ({ id, profileData, isOwner, setProfileData }) => {
  const { setUser } = userStore();
  const [loading, setLoading] = useState(false);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [isEditCoverModel, setIsEditCoverModel] = useState(false);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [isEditProfileModel, setIsEditProfileModel] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      username: profileData?.username || "",
      dateOfBirth: profileData?.dateOfBirth?.split("T")[0] || "",
      gender: profileData?.gender || "",
    },
  });

  const coverImageInputRef = useRef();
  const profileImageInputRef = useRef();

  const onSubmitProfile = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("username", data.username || "");
      formData.append("dateOfBirth", data.dateOfBirth || "");
      formData.append("gender", data.gender || "");

      if (profilePictureFile) {
        formData.append("media", profilePictureFile);
      }

      const response = await updateUserProfile(id, formData);

      setProfileData((prevData) => ({
        ...prevData,
        ...response,
        username: data.username,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        profilePicture: response.profilePicture,
      }));

      setUser(response);

      setIsEditProfileModel(false);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("error updating user profile", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);

      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);
    }
  };

  const onSubmitCoverPhoto = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      if (coverPhotoFile) {
        formData.append("media", coverPhotoFile);
      }
      const response = await updateUserCoverPhoto(id, formData);

      setProfileData((prevData) => ({
        ...prevData,
        coverPhoto: response.coverPhoto,
      }));

      setIsEditCoverModel(false);
      setCoverPhotoFile(null);
      setCoverPhotoPreview(null);

      toast.success("Cover photo updated successfully");
    } catch (error) {
      console.error("error updating user cover photo", error);
      toast.error("Failed to update cover photo");
    } finally {
      setLoading(false);
    }
  };

  const handleCoverPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPhotoFile(file);

      const previewUrl = URL.createObjectURL(file);
      setCoverPhotoPreview(previewUrl);
    }
  };

  return (
    <div className="relative">
      <div
        className="relative h-64 md:h-80 bg-gray-300 overflow-hidden cursor-pointer"
        onClick={() => setIsEditCoverModel(true)}
      >
        <div className="relative w-full h-full">
          {profileData?.coverPhoto && (
            <Image
              src={profileData.coverPhoto}
              alt="cover"
              fill
              sizes="100vw"
              priority
              className="object-cover"
              style={{ objectFit: "cover" }}
            />
          )}
        </div>
        {isOwner && (
          <Button
            className="absolute bottom-4 right-4 flex items-center"
            variant="secondary"
            size="sm"
            onClick={() => setIsEditCoverModel(true)}
          >
            <Camera className=" mr-0 md:mr-2 h-4 w-4" />
            <span className="hidden md:block">Edit Cover Photo</span>
          </Button>
        )}
      </div>
      {/* profile section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end space-x-3 md:space-x-5 mb-4">
          <Avatar className="w-32 h-32 border-4 border-white/50 dark:border-gray-700 mr-3 md:mr-5">
            <AvatarImage
              src={profileData?.profilePicture}
              alt={profileData?.username}
            />
            <AvatarFallback className="dark:bg-gray-400">
              {profileData?.username
                ?.split(" ")
                .map((name) => name[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="mt-4 md:mt-0 text-center md:text-left flex-grow">
            <h1 className="text-3xl font-bold">{profileData?.username}</h1>
            <p className="text-gray-400 font-semibold">
              {profileData?.followerCount} friends
            </p>
          </div>
          {isOwner && (
            <Button
              className="mt-4 md:mt-0 cursor-pointer"
              onClick={() => setIsEditProfileModel(true)}
            >
              <PenLine className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* edit profile model */}
      <AnimatePresence>
        {isEditProfileModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            style={{ position: "fixed", top: 0, left: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Profile
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditProfileModel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form
                className="space-y-4"
                onSubmit={handleSubmit(onSubmitProfile)}
              >
                <div className="flex flex-col items-center mb-4">
                  <Avatar className="w-24 h-24 border-4 border-white/50 dark:border-gray-700 mb-2">
                    <AvatarImage
                      src={profilePicturePreview || profileData?.profilePicture}
                      alt={profileData?.username}
                    />
                    <AvatarFallback className="dark:bg-gray-400">
                      {profileData?.username
                        ?.split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={profileImageInputRef}
                    onChange={handleProfilePictureChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => profileImageInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Profile Picture
                  </Button>
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" {...register("username")} />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth")}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    onValueChange={(value) => setValue("gender", value)}
                    defaultValue={profileData?.gender}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-400 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />{" "}
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* edit cover model */}
      <AnimatePresence>
        {isEditCoverModel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            style={{ position: "fixed", top: 0, left: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Cover Photo
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditCoverModel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <form
                className="space-y-4"
                onSubmit={handleSubmit(onSubmitCoverPhoto)}
              >
                <div className="flex flex-col items-center mb-4">
                  {coverPhotoPreview && (
                    <div className="relative w-full h-40 mb-4">
                      <Image
                        src={coverPhotoPreview}
                        alt="cover-photo"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover rounded-lg"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={coverImageInputRef}
                    onChange={handleCoverPhotoChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverImageInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Select New Cover Photo
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={!coverPhotoFile}
                  className="w-full bg-blue-600 hover:bg-blue-400 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />{" "}
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Cover Photo"
                  )}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileHeader;
