import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LazyMotion, domAnimation, m, AnimatePresence } from "motion/react";
import { eventConfig } from "../../config/event.config";
import { RsvpFormValues, SubmissionState, calculateHeadcount } from "../../types/rsvp";
import { rsvpFormSchema } from "../../lib/rsvpSchema";
import { normalizePhone } from "../../lib/phone";
import { ToggleChoice } from "../ui/ToggleChoice";
import { Stepper } from "../ui/Stepper";
import { ComicButton } from "../ui/ComicButton";
import { SpeechBubble } from "../ui/SpeechBubble";
import { SpiderMaskIcon } from "../ui/SpiderMaskIcon";
import { SpiderEmblem } from "../ui/SpiderEmblem";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import {
  User,
  Mail,
  Phone,
  MessageSquare,
  Users,
  Sparkles,
  AlertCircle,
  Baby,
  Utensils,
  Heart,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export interface RsvpFormProps {
  initialValues?: Partial<RsvpFormValues>;
  submissionState: SubmissionState;
  onSubmit: (values: RsvpFormValues) => void;
}

const DEFAULT_FORM_VALUES: RsvpFormValues = {
  guestFullName: "",
  email: "",
  phone: "",
  isAttending: true,
  hasPlusOne: false,
  plusOneName: "",
  children: [],
  hasNanny: false,
  nannyCount: 0,
  dietaryNotes: "",
  messageToCelebrant: "",
};

export const RsvpForm: React.FC<RsvpFormProps> = ({
  initialValues,
  submissionState,
  onSubmit,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const isSubmitting = submissionState.status === "submitting";

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, touchedFields },
  } = useForm<RsvpFormValues>({
    resolver: zodResolver(rsvpFormSchema),
    mode: "onBlur",
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      ...initialValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "children",
  });

  // Watch key values for conditional rendering & headcount
  const formValues = watch();
  const isAttending = watch("isAttending");
  const hasPlusOne = watch("hasPlusOne");
  const hasNanny = watch("hasNanny");
  const childrenList = watch("children") || [];
  const messageToCelebrant = watch("messageToCelebrant") || "";

  // Synchronize children count with Stepper
  const handleChildrenCountChange = (newCount: number) => {
    const currentCount = fields.length;
    if (newCount > currentCount) {
      for (let i = currentCount; i < newCount; i++) {
        append({
          id: `child-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          age: 5,
          gender: "male",
        });
      }
    } else if (newCount < currentCount) {
      for (let i = currentCount - 1; i >= newCount; i--) {
        remove(i);
      }
    }
  };

  // Pre-fill / update form when initialValues change
  useEffect(() => {
    if (initialValues?.guestFullName) {
      setValue("guestFullName", initialValues.guestFullName, { shouldValidate: true });
    }
  }, [initialValues, setValue]);

  // Phone input blur helper to auto-normalize phone number
  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const normalized = normalizePhone(val);
      setValue("phone", normalized, { shouldTouch: true });
      trigger("phone");
    }
  };

  const totalHeadcount = calculateHeadcount(formValues);

  // Helper breakdown text for summary strip
  const headcountBreakdown = () => {
    if (!isAttending) return "Declining attendance";
    const parts = ["1 adult"];
    if (hasPlusOne) parts.push("1 plus-one");
    if (childrenList.length > 0) parts.push(`${childrenList.length} ${childrenList.length === 1 ? "child" : "children"}`);
    if (hasNanny && formValues.nannyCount > 0) parts.push(`${formValues.nannyCount} ${formValues.nannyCount === 1 ? "nanny" : "nannies"}`);
    return `${parts.join(" + ")} = ${totalHeadcount} total guest${totalHeadcount === 1 ? "" : "s"}`;
  };

  const handleFormSubmit = (data: RsvpFormValues) => {
    // Normalize phone number on submit as double protection
    const normalizedData: RsvpFormValues = {
      ...data,
      phone: normalizePhone(data.phone),
      // Clean up fields if declining or not bringing plus-one/nanny
      plusOneName: data.isAttending && data.hasPlusOne ? data.plusOneName : "",
      children: data.isAttending ? data.children : [],
      nannyCount: data.isAttending && data.hasNanny ? data.nannyCount : 0,
      hasNanny: data.isAttending ? data.hasNanny : false,
      hasPlusOne: data.isAttending ? data.hasPlusOne : false,
    };
    onSubmit(normalizedData);
  };

  return (
    <LazyMotion features={domAnimation}>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        noValidate
        className="space-y-8 text-[#111111]"
      >
        {/* Personal Details Panel */}
        <div className="bg-white border-[3.5px] border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0px_#111111]">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b-[3px] border-[#111111]">
            <div className="w-10 h-10 bg-[#E62429] text-white border-2 border-[#111111] flex items-center justify-center font-display text-xl shadow-[2px_2px_0px_#111111]">
              <SpiderMaskIcon size={24} />
            </div>
            <div>
              <h3 className="font-display text-2xl uppercase tracking-wide text-[#111111]">
                HERO IDENTITY & CONTACT
              </h3>
              <p className="font-body text-xs font-semibold text-slate-600">
                Required for Spider-HQ Entrance Pass
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Full Name Input */}
            <div className="md:col-span-2 space-y-2">
              <label
                htmlFor="guestFullName"
                className="block font-display text-lg uppercase tracking-wide text-[#111111]"
              >
                Full Name <span className="text-[#E23636]">*</span>
              </label>
              <div className="relative">
                <input
                  id="guestFullName"
                  type="text"
                  disabled={isSubmitting}
                  placeholder="e.g. Adebayo Ogunlesi"
                  className={`w-full bg-[#FFFDF5] border-[3px] p-3.5 font-body text-base font-bold text-[#111111] placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 disabled:opacity-60 disabled:cursor-not-allowed ${
                    errors.guestFullName
                      ? "border-[#E23636] bg-red-50"
                      : "border-[#111111]"
                  }`}
                  {...register("guestFullName")}
                />
              </div>
              {errors.guestFullName && (
                <div role="alert" className="mt-2">
                  <SpeechBubble tailPosition="top-left" bg="bg-[#E23636]" className="text-white">
                    <div className="flex items-center gap-2 font-body text-xs font-bold">
                      <AlertCircle className="w-4 h-4 min-w-[16px] text-[#FFD700]" />
                      <span>{errors.guestFullName.message}</span>
                    </div>
                  </SpeechBubble>
                </div>
              )}
            </div>

            {/* 2. Email Input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block font-display text-lg uppercase tracking-wide text-[#111111]"
              >
                Email Address <span className="text-[#E23636]">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  disabled={isSubmitting}
                  placeholder="e.g. adebayo@example.com"
                  className={`w-full bg-[#FFFDF5] border-[3px] p-3.5 font-body text-base font-bold text-[#111111] placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 disabled:opacity-60 disabled:cursor-not-allowed ${
                    errors.email ? "border-[#E23636] bg-red-50" : "border-[#111111]"
                  }`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <div role="alert" className="mt-2">
                  <SpeechBubble tailPosition="top-left" bg="bg-[#E23636]" className="text-white">
                    <div className="flex items-center gap-2 font-body text-xs font-bold">
                      <AlertCircle className="w-4 h-4 min-w-[16px] text-[#FFD700]" />
                      <span>{errors.email.message}</span>
                    </div>
                  </SpeechBubble>
                </div>
              )}
            </div>

            {/* 3. Phone Input */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="block font-display text-lg uppercase tracking-wide text-[#111111]"
              >
                Phone Number <span className="text-[#E23636]">*</span>
              </label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  disabled={isSubmitting}
                  placeholder="e.g. 08012345678 or +234..."
                  className={`w-full bg-[#FFFDF5] border-[3px] p-3.5 font-body text-base font-bold text-[#111111] placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 disabled:opacity-60 disabled:cursor-not-allowed ${
                    errors.phone ? "border-[#E23636] bg-red-50" : "border-[#111111]"
                  }`}
                  {...register("phone", {
                    onBlur: handlePhoneBlur,
                  })}
                />
              </div>
              {errors.phone && (
                <div role="alert" className="mt-2">
                  <SpeechBubble tailPosition="top-left" bg="bg-[#E23636]" className="text-white">
                    <div className="flex items-center gap-2 font-body text-xs font-bold">
                      <AlertCircle className="w-4 h-4 min-w-[16px] text-[#FFD700]" />
                      <span>{errors.phone.message}</span>
                    </div>
                  </SpeechBubble>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Attendance Toggle */}
        <div className="bg-[#FFD700] border-[3px] border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0px_#111111]">
          <Controller
            control={control}
            name="isAttending"
            render={({ field }) => (
              <ToggleChoice
                label={`Will you be joining us at ${eventConfig.celebrant.name}'s Superhero HQ?`}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  trigger("isAttending");
                }}
                options={[
                  {
                    label: "YES! COUNT ME IN 🚀",
                    value: true,
                    color: "bg-[#00AEEF] text-white hover:bg-[#0092c8]",
                  },
                  {
                    label: "CAN'T MAKE IT 😢",
                    value: false,
                    color: "bg-[#E23636] text-white hover:bg-[#c92a2a]",
                  },
                ]}
              />
            )}
          />
        </div>

        {/* CONDITIONAL SECTION 1: IF ATTENDING -> REVEAL PLUS-ONE, CHILDREN, NANNY, DIETARY */}
        <AnimatePresence initial={false}>
          {isAttending && (
            <m.div
              key="attending-section"
              initial={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
              animate={shouldReduceMotion ? {} : { height: "auto", opacity: 1 }}
              exit={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-8 overflow-hidden"
            >
              {/* 5. Plus-One Section */}
              <div className="bg-white border-[3px] border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0px_#111111]">
                <div className="space-y-6">
                  <Controller
                    control={control}
                    name="hasPlusOne"
                    render={({ field }) => (
                      <ToggleChoice
                        label="Are you bringing an adult plus-one?"
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                          if (!val) setValue("plusOneName", "");
                          trigger("hasPlusOne");
                        }}
                        options={[
                          { label: "YES (+1 Adult)", value: true, color: "bg-[#1B4C9B] text-white" },
                          { label: "NO (Just Me)", value: false, color: "bg-slate-200 text-[#111111]" },
                        ]}
                      />
                    )}
                  />

                  {/* Plus-one Name Input */}
                  <AnimatePresence>
                    {hasPlusOne && (
                      <m.div
                        initial={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
                        animate={shouldReduceMotion ? {} : { height: "auto", opacity: 1 }}
                        exit={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden pt-2 border-t-2 border-dashed border-[#111111]/20 space-y-2"
                      >
                        <label
                          htmlFor="plusOneName"
                          className="block font-display text-base uppercase tracking-wide text-[#111111]"
                        >
                          Plus-One's Full Name <span className="text-[#E23636]">*</span>
                        </label>
                        <input
                          id="plusOneName"
                          type="text"
                          disabled={isSubmitting}
                          placeholder="e.g. Chinedu Okonkwo"
                          className={`w-full bg-[#FFFDF5] border-[3px] p-3.5 font-body text-base font-bold text-[#111111] placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-[#00AEEF] disabled:opacity-60 disabled:cursor-not-allowed ${
                            errors.plusOneName ? "border-[#E23636] bg-red-50" : "border-[#111111]"
                          }`}
                          {...register("plusOneName")}
                        />
                        {errors.plusOneName && (
                          <div role="alert" className="mt-2">
                            <SpeechBubble tailPosition="top-left" bg="bg-[#E23636]" className="text-white">
                              <div className="flex items-center gap-2 font-body text-xs font-bold">
                                <AlertCircle className="w-4 h-4 min-w-[16px] text-[#FFD700]" />
                                <span>{errors.plusOneName.message}</span>
                              </div>
                            </SpeechBubble>
                          </div>
                        )}
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 6. Children Section */}
              <div className="bg-white border-[3px] border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0px_#111111]">
                <div className="flex items-center gap-3 pb-4 mb-6 border-b-[3px] border-[#111111]">
                  <div className="w-10 h-10 bg-[#FF4081] text-white border-2 border-[#111111] flex items-center justify-center font-display text-xl">
                    <Baby className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-wide text-[#111111]">
                      CHILD GUESTS (AGES 0-17)
                    </h3>
                    <p className="font-body text-xs font-semibold text-slate-600">
                      We need exact counts for personalized party favors & superhero capes!
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Stepper for number of children */}
                  <Stepper
                    label="How many children are you bringing?"
                    value={fields.length}
                    min={0}
                    max={10}
                    onChange={handleChildrenCountChange}
                  />

                  {/* Child Rows Array */}
                  <AnimatePresence>
                    {fields.length > 0 && (
                      <div className="space-y-4 pt-4 border-t-2 border-dashed border-[#111111]/30">
                        {fields.map((field, index) => (
                          <m.div
                            key={field.id}
                            initial={
                              shouldReduceMotion
                                ? {}
                                : { opacity: 0, y: -10, height: 0 }
                            }
                            animate={
                              shouldReduceMotion
                                ? {}
                                : { opacity: 1, y: 0, height: "auto" }
                            }
                            exit={
                              shouldReduceMotion
                                ? {}
                                : { opacity: 0, y: -10, height: 0 }
                            }
                            transition={{
                              duration: 0.25,
                              delay: index * 0.06,
                              ease: "easeInOut",
                            }}
                            className="bg-[#FDF6E3] border-[3px] border-[#111111] p-4 sm:p-5 shadow-[3px_3px_0px_#111111] space-y-4"
                          >
                            <div className="flex items-center justify-between border-b-2 border-[#111111] pb-2">
                              <span className="font-display text-lg uppercase tracking-wide text-[#111111] flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#E23636]" />
                                <span>Child {index + 1}</span>
                              </span>
                              <span className="font-body text-xs font-bold text-slate-500">
                                Required
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Child Age Stepper */}
                              <Controller
                                control={control}
                                name={`children.${index}.age`}
                                render={({ field: ageField }) => (
                                  <Stepper
                                    label="Age"
                                    value={ageField.value}
                                    min={0}
                                    max={17}
                                    onChange={(val) => ageField.onChange(val)}
                                  />
                                )}
                              />

                              {/* Child Gender Toggle */}
                              <Controller
                                control={control}
                                name={`children.${index}.gender`}
                                render={({ field: genderField }) => (
                                  <ToggleChoice
                                    label="Gender"
                                    value={genderField.value}
                                    onChange={(val) => genderField.onChange(val)}
                                    options={[
                                      {
                                        label: "BOY 👦",
                                        value: "male",
                                        color: "bg-[#00AEEF] text-white",
                                      },
                                      {
                                        label: "GIRL 👧",
                                        value: "female",
                                        color: "bg-[#FF4081] text-white",
                                      },
                                    ]}
                                  />
                                )}
                              />
                            </div>
                          </m.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 7. Nanny Section */}
              <div className="bg-white border-[3px] border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0px_#111111]">
                <div className="space-y-6">
                  <Controller
                    control={control}
                    name="hasNanny"
                    render={({ field }) => (
                      <ToggleChoice
                        label="Are you bringing a nanny or caretaker?"
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                          setValue("nannyCount", val ? 1 : 0);
                          trigger("hasNanny");
                        }}
                        options={[
                          { label: "YES (Bringing Nanny)", value: true, color: "bg-[#00AEEF] text-white" },
                          { label: "NO", value: false, color: "bg-slate-200 text-[#111111]" },
                        ]}
                      />
                    )}
                  />

                  {/* Nanny Count Stepper */}
                  <AnimatePresence>
                    {hasNanny && (
                      <m.div
                        initial={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
                        animate={shouldReduceMotion ? {} : { height: "auto", opacity: 1 }}
                        exit={shouldReduceMotion ? {} : { height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden pt-4 border-t-2 border-dashed border-[#111111]/20"
                      >
                        <Controller
                          control={control}
                          name="nannyCount"
                          render={({ field }) => (
                            <Stepper
                              label="How many nannies or caretakers?"
                              value={field.value < 1 ? 1 : field.value}
                              min={1}
                              max={5}
                              onChange={(val) => field.onChange(val)}
                            />
                          )}
                        />
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* 8. Dietary Preferences */}
              <div className="bg-white border-[3px] border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0px_#111111] space-y-3">
                <label
                  htmlFor="dietaryNotes"
                  className="block font-display text-lg uppercase tracking-wide text-[#111111] flex items-center gap-2"
                >
                  <Utensils className="w-5 h-5 text-[#E23636]" />
                  <span>Dietary Preferences or Allergies (Optional)</span>
                </label>
                <textarea
                  id="dietaryNotes"
                  disabled={isSubmitting}
                  rows={2}
                  placeholder="e.g. No peanut oil, vegetarian options needed, halal only..."
                  className="w-full bg-[#FFFDF5] border-[3px] border-[#111111] p-3.5 font-body text-base font-bold text-[#111111] placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 disabled:opacity-60"
                  {...register("dietaryNotes")}
                />
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* 9. Message to Celebrant (Rendered for both Attending & Declining) */}
        <div className="bg-white border-[3px] border-[#111111] p-6 sm:p-8 shadow-[6px_6px_0px_#111111] space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="messageToCelebrant"
              className="block font-display text-lg uppercase tracking-wide text-[#111111] flex items-center gap-2"
            >
              <Heart className="w-5 h-5 text-[#E23636] fill-[#E23636]" />
              <span>Leave a message for {eventConfig.celebrant.name} (Optional)</span>
            </label>
            <span
              className={`font-mono text-xs font-bold ${
                messageToCelebrant.length > 280 ? "text-[#E23636]" : "text-slate-500"
              }`}
            >
              {messageToCelebrant.length}/300
            </span>
          </div>
          <textarea
            id="messageToCelebrant"
            disabled={isSubmitting}
            rows={3}
            maxLength={300}
            placeholder={`Write a birthday wish or superhero note for ${eventConfig.celebrant.name}!`}
            className="w-full bg-[#FFFDF5] border-[3px] border-[#111111] p-3.5 font-body text-base font-bold text-[#111111] placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 disabled:opacity-60"
            {...register("messageToCelebrant")}
          />
        </div>

        {/* 10. LIVE HEADCOUNT SUMMARY STRIP */}
        <div className="bg-[#111111] text-white p-5 border-[3px] border-[#111111] shadow-[6px_6px_0px_#FFD700] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD700] text-[#111111] border-2 border-white flex items-center justify-center font-display text-xl">
              <Users className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-display text-xl uppercase tracking-wide text-[#FFD700]">
                YOUR TOTAL HEADCOUNT SUMMARY
              </p>
              <p className="font-body text-sm font-semibold text-slate-300">
                {headcountBreakdown()}
              </p>
            </div>
          </div>

          <div className="bg-[#1B4C9B] border-2 border-white px-5 py-2.5 font-display text-2xl sm:text-3xl text-[#FFD700] tracking-wider whitespace-nowrap">
            {totalHeadcount} {totalHeadcount === 1 ? "GUEST" : "GUESTS"}
          </div>
        </div>

        {/* 11. SUBMIT BUTTON */}
        <div className="pt-2 text-center">
          <ComicButton
            type="submit"
            variant="accent"
            size="lg"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-10 py-5 text-2xl sm:text-3xl tracking-wider gap-3 shadow-[8px_8px_0px_#111111] hover:shadow-[4px_4px_0px_#111111]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
                <span>DISPATCHING SPIDER RSVP...</span>
              </>
            ) : (
              <>
                <SpiderMaskIcon size={32} />
                <span>THWIP! SEND SPIDER RSVP 🚀</span>
              </>
            )}
          </ComicButton>
          <p className="font-body text-xs font-bold text-slate-500 mt-3 flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#E62429]" />
            <span>Instant Spider-HQ confirmation. No registration required.</span>
          </p>
        </div>
      </form>
    </LazyMotion>
  );
};
