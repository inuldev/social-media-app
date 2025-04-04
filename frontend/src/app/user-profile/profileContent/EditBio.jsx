import toast from "react-hot-toast";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Save, Loader2 } from "lucide-react";

import { createOrUpdateUserBio } from "@/service/user.service";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EditBio = ({ isOpen, onClose, initialData, id, fetchProfile }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: initialData || {
      bioText: "",
      liveIn: "",
      relationship: "",
      workplace: "",
      education: "",
      phone: "",
      hometown: "",
    },
  });

  const handleEditBio = async (data) => {
    try {
      await createOrUpdateUserBio(id, data);
      toast.success("user bio updated successfully");
      await fetchProfile();
      onClose();
    } catch (error) {
      console.log("error creating or updating user bio", error);
    }
  };

  useEffect(() => {
    // Only reset if initialData is an object
    if (initialData && typeof initialData === "object") {
      reset(initialData);
    }
  }, [isOpen, initialData, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Bio</DialogTitle>
          <DialogDescription>
            Edit your bio and other information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleEditBio)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bio" className="text-right">
                Bio
              </Label>
              <Textarea
                id="bioText"
                className="col-span-3"
                {...register("bioText")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="liveIn" className="text-right">
                Live In
              </Label>
              <Input
                id="liveIn"
                className="col-span-3"
                {...register("liveIn")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="relationship" className="text-right">
                Relationship
              </Label>
              <Input
                id="relationship"
                className="col-span-3"
                {...register("relationship")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workPlace" className="text-right">
                Work Place
              </Label>
              <Input
                id="workplace"
                className="col-span-3"
                {...register("workplace")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="education" className="text-right">
                Education
              </Label>
              <Input
                id="education"
                className="col-span-3"
                {...register("education")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input id="phone" className="col-span-3" {...register("phone")} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hometown" className="text-right">
                Hometown
              </Label>
              <Input
                id="hometown"
                className="col-span-3"
                {...register("hometown")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBio;
