"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";

import Loader from "@/lib/Loader";
import { fetchUserProfile } from "@/service/user.service";

import ProfileTabs from "@/app/user-profile/ProfileTabs";
import ProfileHeader from "@/app/user-profile/ProfileHeader";

const Page = () => {
  const params = useParams();
  const id = params.id;
  const profileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const result = await fetchUserProfile(id);
      setProfileData(result.profile);
      setIsOwner(result.isOwner);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  if (loading || !profileData) {
    return <Loader />;
  }

  return (
    <div ref={profileRef}>
      <ProfileHeader
        id={id}
        profileData={profileData}
        setProfileData={setProfileData}
        isOwner={isOwner}
        fetchProfile={fetchProfile}
      />
      <ProfileTabs
        id={id}
        profileData={profileData}
        setProfileData={setProfileData}
        isOwner={isOwner}
        fetchProfile={fetchProfile}
      />
    </div>
  );
};

export default Page;
