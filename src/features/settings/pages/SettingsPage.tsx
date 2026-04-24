"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import dayjs, { type Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DashboardSidebar } from "@/features/dashboard/components/DashboardSidebar";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { MobileBottomDock } from "@/features/dashboard/components/MobileBottomDock";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { useDashboardAuthGuard } from "@/features/dashboard/hooks/useDashboardAuthGuard";
import { notifyLanguageChanged, useI18n } from "@/shared/i18n/useI18n";
import { getAccessTokenFromStorage, patchStoredSessionUser } from "@/shared/utils/session";
import { resolveAssetUrl } from "@/shared/utils/assetUrl";
import {
  updateProfile,
  changePassword,
  uploadProfileAvatar,
  checkUsernameAvailability,
  checkEmailAvailability,
  type UpdateProfilePayload,
  type SettingsUserResponse,
} from "@/features/settings/api/settings.api";
import { fetchMe } from "@/features/dashboard/api/dashboard.api";
import {
  fetchCountryAndPhoneOptions,
  getLanguageOptions,
  type CountryOption,
  type PhoneCodeOption,
  type LanguageOption,
} from "@/features/settings/data/profileOptions";
import "@/features/dashboard/pages/DashboardPage.css";
import "./SettingsPage.css";

type ProfileForm = {
  username: string;
  email: string;
  displayName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  dateOfBirth: string;
  country: string;
  preferredLanguage: string;
};

type SelectOption = {
  value: string;
  label: string;
};

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error" | "current";

const EMPTY_PROFILE: ProfileForm = {
  username: "",
  email: "",
  displayName: "",
  phoneCountryCode: "",
  phoneNumber: "",
  dateOfBirth: "",
  country: "",
  preferredLanguage: "en",
};

function normalizeProfile(form: ProfileForm): ProfileForm {
  return {
    ...form,
    username: form.username.trim(),
    email: form.email.trim(),
    displayName: form.displayName.trim(),
    phoneCountryCode: form.phoneCountryCode.trim(),
    phoneNumber: form.phoneNumber.trim(),
    dateOfBirth: form.dateOfBirth.trim(),
    country: form.country.trim(),
    preferredLanguage: form.preferredLanguage.trim(),
  };
}

function fromUserToProfileForm(user: {
  username?: string | null;
  email?: string | null;
  displayName?: string | null;
  phoneCountryCode?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  country?: string | null;
  preferredLanguage?: string | null;
}): ProfileForm {
  return {
    username: user.username || "",
    email: user.email || "",
    displayName: user.displayName || user.username || "",
    phoneCountryCode: user.phoneCountryCode || "",
    phoneNumber: user.phoneNumber || "",
    dateOfBirth: user.dateOfBirth || "",
    country: user.country || "",
    preferredLanguage: user.preferredLanguage || "en",
  };
}

function toPickerValue(value: string): Dayjs | null {
  if (!value) {
    return null;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function isValidUsername(value: string): boolean {
  return /^[a-zA-Z0-9_]{3,30}$/.test(value);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function Toggle({ checked, onChange, label, compact = false }: { checked: boolean; onChange: () => void; label: string; compact?: boolean }) {
  return (
    <button
      type="button"
      className={`settings-toggle ${checked ? "is-on" : ""} ${compact ? "settings-toggle--compact" : ""}`}
      onClick={onChange}
      aria-pressed={checked}
      aria-label={label}
    >
      <span className="settings-toggle__thumb" />
    </button>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="settings-section__header">
      <div className="settings-section__title-wrap">
        <span className="settings-section__icon">
          <i className={icon} />
        </span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function ActionRow({ icon, label, onClick, rightSide }: { icon: string; label: string; onClick?: () => void; rightSide?: React.ReactNode }) {
  return (
    <div className="settings-action-row" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="settings-action-row__left">
        <span className="settings-action-row__icon">
          <i className={icon} />
        </span>
        <span>{label}</span>
      </div>
      <div className="settings-action-row__right">
        {rightSide}
        {!rightSide && (
          <span className="settings-action-row__chevron">
            <i className="fa-solid fa-angle-right" />
          </span>
        )}
      </div>
    </div>
  );
}

function SearchableDropdown({
  value,
  options,
  placeholder,
  searchPlaceholder,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");

  const selected = useMemo(() => {
    return options.find((option) => option.value === value)?.label || "";
  }, [options, value]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return options;
    }

    return options.filter((option) => {
      return option.label.toLowerCase().includes(keyword) || option.value.toLowerCase().includes(keyword);
    });
  }, [options, query]);

  return (
    <details className="settings-dropdown" onToggle={(event) => {
      const details = event.currentTarget;
      if (!details.open) {
        setQuery("");
      }
    }}>
      <summary className="settings-dropdown__trigger">
        <span>{selected || placeholder}</span>
        <i className="fa-solid fa-angle-down" />
      </summary>
      <div className="settings-dropdown__panel">
        <input
          type="text"
          className="settings-dropdown__search"
          placeholder={searchPlaceholder || "Search..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="settings-dropdown__list">
          <button
            type="button"
            className={`settings-dropdown__item ${!value ? "is-selected" : ""}`}
            onClick={() => onChange("")}
          >
            {placeholder}
          </button>
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`settings-dropdown__item ${option.value === value ? "is-selected" : ""}`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}

export function SettingsPage() {
  const { isChecking, isAuthenticated } = useDashboardAuthGuard();
  const { walletBalance, profile } = useDashboardData();
  const { t } = useI18n();
  const router = useRouter();


  const [profileForm, setProfileForm] = useState<ProfileForm>(EMPTY_PROFILE);
  const [initialProfileForm, setInitialProfileForm] = useState<ProfileForm>(EMPTY_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  const [usernameStatus, setUsernameStatus] = useState<AvailabilityStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>("idle");
  const [emailMessage, setEmailMessage] = useState("");

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [phoneCodes, setPhoneCodes] = useState<PhoneCodeOption[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);

  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarDraftFile, setAvatarDraftFile] = useState<File | null>(null);
  const [avatarDraftPreview, setAvatarDraftPreview] = useState("");
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarPreview, setPendingAvatarPreview] = useState("");
  const [avatarError, setAvatarError] = useState("");

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState({ text: "", type: "" });

  const [preferences, setPreferences] = useState({
    twoFactor: false,
    emailAccount: true,
    emailPromotions: false,
    emailOffers: true,
    sms: false,
    push: false,
    promoOffers: true,
  });

  const optionsLocale = useMemo(() => {
    const language = profileForm.preferredLanguage?.trim();
    if (language) {
      return language;
    }

    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }

    return "en";
  }, [profileForm.preferredLanguage]);

  const applyUserToLocalState = (user: SettingsUserResponse, markSavedAsInitial: boolean) => {
    const mapped = fromUserToProfileForm(user);
    setProfileForm(mapped);
    if (markSavedAsInitial) {
      setInitialProfileForm(mapped);
    }

    const nextAvatar = user.avatarUrl || null;
    setSavedAvatarUrl(nextAvatar);

    setUsernameStatus("current");
    setUsernameMessage("This is your current username.");
    setEmailStatus("current");
    setEmailMessage("This is your current email.");

    patchStoredSessionUser({
      username: user.username || mapped.username,
      email: user.email || mapped.email,
      avatarUrl: nextAvatar || undefined,
      displayName: mapped.displayName,
      phoneNumber: mapped.phoneNumber,
      phoneCountryCode: mapped.phoneCountryCode,
      country: mapped.country,
      timezone: user.timezone || "",
      preferredLanguage: mapped.preferredLanguage,
      dateOfBirth: mapped.dateOfBirth,
    });

    notifyLanguageChanged(mapped.preferredLanguage);
  };

  useEffect(() => {
    setSavedAvatarUrl(profile.avatarUrl || null);
  }, [profile.avatarUrl]);

  useEffect(() => {
    return () => {
      if (avatarDraftPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarDraftPreview);
      }
      if (pendingAvatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(pendingAvatarPreview);
      }
    };
  }, [avatarDraftPreview, pendingAvatarPreview]);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) return;

    fetchMe(token)
      .then((res) => {
        if (!res.success || !res.data?.user) {
          return;
        }

        applyUserToLocalState(res.data.user, true);
        setProfileLoaded(true);
      })
      .catch(() => {
        setProfileLoaded(true);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      const [countryData] = await Promise.all([fetchCountryAndPhoneOptions(optionsLocale)]);
      if (cancelled) {
        return;
      }

      setCountries(countryData.countries);
      setPhoneCodes(countryData.phoneCodes);
      setLanguages(getLanguageOptions(optionsLocale));
    }

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [optionsLocale]);

  useEffect(() => {
    if (!profileLoaded) {
      return;
    }

    const username = profileForm.username.trim();
    const initialUsername = initialProfileForm.username.trim();
    if (!username) {
      setUsernameStatus("invalid");
      setUsernameMessage("Username is required.");
      return;
    }
    if (!isValidUsername(username)) {
      setUsernameStatus("invalid");
      setUsernameMessage("Use 3-30 letters, numbers, or underscores.");
      return;
    }
    if (username.toLowerCase() === initialUsername.toLowerCase()) {
      setUsernameStatus("current");
      setUsernameMessage("This is your current username.");
      return;
    }

    const token = getAccessTokenFromStorage();
    if (!token) {
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("Checking username...");

    const timer = window.setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(token, username);
        if (res.data.available) {
          setUsernameStatus(res.data.reason === "current" ? "current" : "available");
          setUsernameMessage(res.data.reason === "current" ? "This is your current username." : "Username is available.");
          return;
        }
        setUsernameStatus("taken");
        setUsernameMessage("Username already exists.");
      } catch {
        setUsernameStatus("error");
        setUsernameMessage("Could not check username right now.");
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [profileForm.username, initialProfileForm.username, profileLoaded]);

  useEffect(() => {
    if (!profileLoaded) {
      return;
    }

    const email = profileForm.email.trim();
    const initialEmail = initialProfileForm.email.trim();

    if (!email) {
      setEmailStatus("invalid");
      setEmailMessage("Email is required.");
      return;
    }

    if (!isValidEmail(email)) {
      setEmailStatus("invalid");
      setEmailMessage("Enter a valid email address.");
      return;
    }

    if (email.toLowerCase() === initialEmail.toLowerCase()) {
      setEmailStatus("current");
      setEmailMessage("This is your current email.");
      return;
    }

    const token = getAccessTokenFromStorage();
    if (!token) {
      return;
    }

    setEmailStatus("checking");
    setEmailMessage("Checking email...");

    const timer = window.setTimeout(async () => {
      try {
        const res = await checkEmailAvailability(token, email);
        if (res.data.available) {
          setEmailStatus(res.data.reason === "current" ? "current" : "available");
          setEmailMessage(res.data.reason === "current" ? "This is your current email." : "Email is available.");
          return;
        }
        setEmailStatus("taken");
        setEmailMessage("Email already exists.");
      } catch {
        setEmailStatus("error");
        setEmailMessage("Could not check email right now.");
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [profileForm.email, initialProfileForm.email, profileLoaded]);

  const countryOptions = useMemo<SelectOption[]>(() => {
    return countries.map((country) => ({
      value: country.name,
      label: country.name,
    }));
  }, [countries]);

  const phoneCodeOptions = useMemo<SelectOption[]>(() => {
    return phoneCodes.map((item) => ({
      value: item.code,
      label: item.label,
    }));
  }, [phoneCodes]);

  const languageOptions = useMemo<SelectOption[]>(() => {
    return languages.map((language) => ({
      value: language.code,
      label: language.label,
    }));
  }, [languages]);

  const isFormDirty = useMemo(() => {
    if (!profileLoaded) {
      return false;
    }

    return JSON.stringify(normalizeProfile(profileForm)) !== JSON.stringify(normalizeProfile(initialProfileForm));
  }, [profileForm, initialProfileForm, profileLoaded]);

  const isAvatarDirty = Boolean(pendingAvatarFile);
  const isProfileDirty = isFormDirty || isAvatarDirty;

  const displayAvatarUrl = pendingAvatarPreview || savedAvatarUrl || profile.avatarUrl || null;
  const displayAvatarSrc = resolveAssetUrl(displayAvatarUrl);

  if (isChecking) return <div className="dashboard-auth-loading" aria-hidden="true" />;
  if (!isAuthenticated) return null;

  const onFieldChange = (field: keyof ProfileForm, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));

    if (field === "preferredLanguage") {
      notifyLanguageChanged(value);
    }
  };

  const clearAvatarDraft = () => {
    if (avatarDraftPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarDraftPreview);
    }
    setAvatarDraftFile(null);
    setAvatarDraftPreview("");
  };

  const clearPendingAvatar = () => {
    if (pendingAvatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(pendingAvatarPreview);
    }
    setPendingAvatarFile(null);
    setPendingAvatarPreview("");
  };

  const handleAvatarDraftFile = (file: File | null) => {
    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Only JPG, PNG and WEBP files are allowed.");
      return;
    }

    if (file.size > maxSize) {
      setAvatarError("Image size must be 5MB or less.");
      return;
    }

    setAvatarError("");
    if (avatarDraftPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarDraftPreview);
    }

    setAvatarDraftFile(file);
    setAvatarDraftPreview(URL.createObjectURL(file));
  };

  const applyAvatarDraft = () => {
    if (!avatarDraftFile || !avatarDraftPreview) {
      setAvatarError("Please choose an image first.");
      return;
    }

    clearPendingAvatar();
    setPendingAvatarFile(avatarDraftFile);
    setPendingAvatarPreview(avatarDraftPreview);
    setAvatarDraftFile(null);
    setAvatarDraftPreview("");
    setAvatarError("");
    setAvatarModalOpen(false);
  };

  const handleProfileSave = async () => {
    const token = getAccessTokenFromStorage();
    if (!token) return;

    if (["invalid", "taken", "checking"].includes(usernameStatus)) {
      setProfileMessage({ text: "Please resolve username availability before saving.", type: "error" });
      return;
    }

    if (["invalid", "taken", "checking"].includes(emailStatus)) {
      setProfileMessage({ text: "Please resolve email availability before saving.", type: "error" });
      return;
    }

    setProfileLoading(true);
    setProfileMessage({ text: "", type: "" });

    try {
      let latestUser: SettingsUserResponse | null = null;

      if (pendingAvatarFile) {
        const uploadRes = await uploadProfileAvatar(token, pendingAvatarFile);
        if (uploadRes.success) {
          latestUser = uploadRes.data.user;
          setSavedAvatarUrl(uploadRes.data.user.avatarUrl || null);
          clearPendingAvatar();
        }
      }

      const payload: UpdateProfilePayload = {};
      const changed = normalizeProfile(profileForm);
      const initial = normalizeProfile(initialProfileForm);

      if (changed.username !== initial.username) payload.username = profileForm.username;
      if (changed.email !== initial.email) payload.email = profileForm.email;
      if (changed.displayName !== initial.displayName) payload.displayName = profileForm.displayName;
      if (changed.phoneCountryCode !== initial.phoneCountryCode) payload.phoneCountryCode = profileForm.phoneCountryCode;
      if (changed.phoneNumber !== initial.phoneNumber) payload.phoneNumber = profileForm.phoneNumber;
      if (changed.dateOfBirth !== initial.dateOfBirth) payload.dateOfBirth = profileForm.dateOfBirth || undefined;
      if (changed.country !== initial.country) payload.country = profileForm.country;
      if (changed.preferredLanguage !== initial.preferredLanguage) payload.preferredLanguage = profileForm.preferredLanguage;

      if (isFormDirty) {
        const res = await updateProfile(token, payload);
        if (res.success) {
          latestUser = res.data.user;
        }
      }

      if (latestUser) {
        applyUserToLocalState(latestUser, true);
        setProfileMessage({ text: "Profile updated successfully!", type: "success" });
      } else {
        setProfileMessage({ text: "No changes to save.", type: "success" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setProfileMessage({ text: message, type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwMessage({ text: "", type: "" });
    if (newPw !== confirmPw) {
      setPwMessage({ text: "Passwords do not match", type: "error" });
      return;
    }
    if (newPw.length < 8) {
      setPwMessage({ text: "Password must be at least 8 characters", type: "error" });
      return;
    }

    const token = getAccessTokenFromStorage();
    if (!token) return;

    setPwLoading(true);
    try {
      const res = await changePassword(token, { currentPassword: currentPw, newPassword: newPw });
      if (res.success) {
        setPwMessage({ text: "Password changed successfully!", type: "success" });
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        setTimeout(() => setPwModalOpen(false), 1200);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password";
      setPwMessage({ text: message, type: "error" });
    } finally {
      setPwLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const initial = (profileForm.displayName || profileForm.username || "U")[0].toUpperCase();

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="krabet-page">
        <div className="krabet-shell">
          <DashboardSidebar logoSrc="/KRABETS-LOGO.png" />
          <main className="krabet-main">
            <DashboardHeader
              walletBalance={walletBalance}
              username={profileForm.username || profile.username}
              email={profileForm.email || profile.email}
              avatarUrl={displayAvatarUrl}
              displayName={profileForm.displayName}
              country={profileForm.country}
              phoneNumber={profileForm.phoneNumber}
              phoneCountryCode={profileForm.phoneCountryCode}
              preferredLanguage={profileForm.preferredLanguage}
              dateOfBirth={profileForm.dateOfBirth}
            />

            <div className="krabet-wallet-content">
              <section className="settings-page-shell">
                <div className="settings-page-bg" />

                <div className="settings-page-content">
                  <div className="settings-page-title-wrap">
                    <h1 className="settings-page-title">{t("settings.title", "Settings")}</h1>
                    <p className="settings-page-subtitle">
                      {t(
                        "settings.subtitle",
                        "Manage your profile, security, preferences, and support options.",
                      )}
                    </p>
                  </div>

                  <div className="settings-sections-stack">
                    <div className="settings-grid">
                      <section className="settings-section settings-section--profile">
                        <SectionHeader
                          icon="fa-solid fa-user"
                          title={t("settings.accountProfile", "Account / Profile")}
                        />
                        <p className="settings-section__description">
                          {t("settings.accountDescription", "Core identity and personal information.")}
                        </p>

                        <div className="settings-field-grid">
                          <label className="settings-label-group">
                            <span><i className="fa-solid fa-id-card" /> {t("settings.displayName", "Display Name")}</span>
                            <input
                              type="text"
                              placeholder={t("settings.enterDisplayName", "Enter display name")}
                              value={profileForm.displayName}
                              onChange={(e) => onFieldChange("displayName", e.target.value)}
                            />
                          </label>

                          <label className="settings-label-group">
                            <span><i className="fa-solid fa-at" /> {t("settings.username", "Username")}</span>
                            <input
                              type="text"
                              value={profileForm.username}
                              onChange={(e) => onFieldChange("username", e.target.value)}
                              placeholder={t("settings.enterUsername", "Enter username")}
                            />
                            <small className={`settings-field-status settings-field-status--${usernameStatus}`}>
                              {usernameMessage}
                            </small>
                          </label>

                          <label className="settings-label-group settings-label-group--full">
                            <span><i className="fa-solid fa-envelope" /> {t("settings.email", "Email Address")}</span>
                            <input
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => onFieldChange("email", e.target.value)}
                              placeholder={t("settings.enterEmail", "Enter email")}
                            />
                            <small className={`settings-field-status settings-field-status--${emailStatus}`}>
                              {emailMessage}
                            </small>
                          </label>

                          <label className="settings-label-group settings-label-group--full">
                            <span><i className="fa-solid fa-phone" /> {t("settings.phoneNumber", "Phone Number")}</span>
                            <div className="settings-inline-input-grid">
                              <div>
                                <SearchableDropdown
                                  value={profileForm.phoneCountryCode}
                                  onChange={(value) => onFieldChange("phoneCountryCode", value)}
                                  options={phoneCodeOptions}
                                  placeholder={t("settings.selectCode", "Select code")}
                                  searchPlaceholder={t("settings.search", "Search...")}
                                />
                              </div>
                              <input
                                type="tel"
                                placeholder={t("settings.enterPhoneNumber", "Enter phone number")}
                                value={profileForm.phoneNumber}
                                onChange={(e) => onFieldChange("phoneNumber", e.target.value)}
                              />
                            </div>
                          </label>

                          <div className="settings-dob-field">
                            <span><i className="fa-solid fa-calendar-days" /> {t("settings.dateOfBirth", "Date of Birth")}</span>
                            <div style={{
                              background: "linear-gradient(180deg, rgba(71, 18, 117, 0.466), rgba(37, 9, 71, 0.849)), rgba(13, 4, 24, 0.884)",
                              borderRadius: "12px",
                              border: "1px solid rgba(199, 132, 255, 0.18)",
                              boxShadow: "inset 0 1px 0 rgba(59, 24, 104, 0.795)",
                            }}>
                              <DatePicker
                                value={toPickerValue(profileForm.dateOfBirth)}
                                onChange={(value: Dayjs | null) => {
                                  onFieldChange("dateOfBirth", value ? value.format("YYYY-MM-DD") : "");
                                }}
                                format="DD/MM/YYYY"
                                disableFuture
                                slotProps={{
                                  textField: {
                                    size: "medium",
                                    fullWidth: true,
                                  },
                                  popper: {
                                    className: "settings-picker-popper",
                                  },
                                  day: {
                                    sx: {
                                      color: "#ffffff !important",
                                      "&.Mui-disabled": {
                                        color: "rgba(255, 255, 255, 0.42) !important",
                                      },
                                      "&.Mui-selected": {
                                        color: "#ffffff !important",
                                      },
                                    },
                                  },
                                }}
                                sx={{
                                  width: "100%",
                                  "& .MuiOutlinedInput-root": {
                                    color: "#f6ecff",
                                    borderRadius: "12px",
                                    minHeight: "46px",
                                    background: "transparent",
                                    boxShadow: "none",
                                    "& fieldset": {
                                      border: "none",
                                    },
                                    "&:hover fieldset": {
                                      border: "none",
                                    },
                                    "&.Mui-focused fieldset": {
                                      border: "none",
                                    },
                                    "&.Mui-focused": {
                                      boxShadow: "none",
                                    },
                                  },
                                  "& .MuiOutlinedInput-input": {
                                    padding: "12px 14px",
                                    color: "#f6ecff",
                                  },
                                  "& .MuiSvgIcon-root": {
                                    color: "#cf8cff",
                                  },
                                }}
                              />
                            </div>
                          </div>

                          <label className="settings-label-group settings-label-group--full">
                            <span><i className="fa-solid fa-earth-africa" /> {t("settings.countryRegion", "Country / Region")}</span>
                            <SearchableDropdown
                              value={profileForm.country}
                              onChange={(value) => onFieldChange("country", value)}
                              options={countryOptions}
                              placeholder={t("settings.selectCountryRegion", "Select country / region")}
                              searchPlaceholder={t("settings.search", "Search...")}
                            />
                          </label>

                          <label className="settings-label-group settings-label-group--full">
                            <span><i className="fa-solid fa-language" /> {t("settings.preferredLanguage", "Preferred Language")}</span>
                            <SearchableDropdown
                              value={profileForm.preferredLanguage}
                              onChange={(value) => onFieldChange("preferredLanguage", value)}
                              options={languageOptions}
                              placeholder={t("settings.selectPreferredLanguage", "Select preferred language")}
                              searchPlaceholder={t("settings.search", "Search...")}
                            />
                          </label>
                        </div>

                        <div className="settings-profile-picture">
                          <div className="settings-profile-picture__left">
                            <div className="settings-avatar">
                              {displayAvatarSrc ? (
                                <img src={displayAvatarSrc} alt="avatar" className="settings-avatar__image" />
                              ) : (
                                <span>{initial}</span>
                              )}
                              {pendingAvatarFile && (
                                <button
                                  type="button"
                                  className="settings-avatar-remove"
                                  onClick={clearPendingAvatar}
                                  aria-label="Remove selected profile image"
                                >
                                  <i className="fa-solid fa-xmark" />
                                </button>
                              )}
                            </div>
                            <div className="settings-profile-picture__meta">
                              <h4>{t("settings.profilePicture", "Profile Picture")}</h4>
                              <p>{t("settings.optionalAvatarHelp", "Optional. JPG, PNG or WEBP. Max 5MB.")}</p>
                              {pendingAvatarFile && (
                                <p className="settings-help-text">
                                  {t("settings.pendingAvatarHelp", "New image selected. Save Changes to upload.")}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="settings-profile-picture__actions">
                            <button className="settings-btn settings-btn--secondary" type="button" onClick={() => setAvatarModalOpen(true)}>
                              <i className="fa-solid fa-upload" />
                              <span>
                                {pendingAvatarFile
                                  ? t("settings.changeUpload", "Change Upload")
                                  : t("settings.uploadImage", "Upload Image")}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="settings-section__footer" style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                          <button
                            className="settings-btn settings-btn--primary"
                            type="button"
                            onClick={handleProfileSave}
                            disabled={profileLoading || !isProfileDirty}
                          >
                            <i className="fa-solid fa-floppy-disk" />
                            <span>
                              {profileLoading
                                ? t("settings.saving", "Saving...")
                                : t("settings.saveChanges", "Save Changes")}
                            </span>
                          </button>
                          {!isProfileDirty && profileLoaded && (
                            <span className="settings-help-text">{t("settings.noChangesYet", "No changes yet.")}</span>
                          )}
                          {profileMessage.text && (
                            <span style={{ color: profileMessage.type === "error" ? "#ff7aa5" : "#4ade80", fontSize: "0.9rem", fontWeight: "600" }}>
                              {profileMessage.text}
                            </span>
                          )}
                        </div>
                      </section>

                      <div className="settings-side-stack">
                        <section className="settings-section">
                          <SectionHeader
                            icon="fa-solid fa-shield-halved"
                            title={t("settings.securitySettings", "Security Settings")}
                          />

                          <div className="settings-action-list">
                            <ActionRow
                              icon="fa-solid fa-key"
                              label={t("settings.changePassword", "Change Password")}
                              onClick={() => router.push("/auth/forgot-password")}
                            />

                            <ActionRow
                              icon="fa-solid fa-clock-rotate-left"
                              label={t("settings.loginActivity", "Login Activity / Session History")}
                              onClick={() => router.push("/dashboard/coming-soon")}
                            />

                          </div>
                        </section>

                        <section className="settings-section settings-section--support">
                          <SectionHeader
                            icon="fa-solid fa-headset"
                            title={t("settings.supportHelp", "Support & Help")}
                          />

                          <div className="settings-support-grid">
                            <ActionRow
                              icon="fa-solid fa-life-ring"
                              label={t("settings.contactSupport", "Contact Support")}
                              onClick={() => router.push("/dashboard/coming-soon")}
                            />
                            <ActionRow
                              icon="fa-solid fa-comments"
                              label={t("settings.liveChat", "Live Chat")}
                              onClick={() => router.push("/dashboard/chat")}
                            />
                            <ActionRow
                              icon="fa-solid fa-circle-question"
                              label={t("settings.faq", "FAQ")}
                              onClick={() => router.push("/dashboard/faq")}
                            />
                            <ActionRow
                              icon="fa-solid fa-triangle-exclamation"
                              label={t("settings.reportProblem", "Report a Problem")}
                              onClick={() => router.push("/dashboard/coming-soon")}
                            />
                            <ActionRow
                              icon="fa-solid fa-user-slash"
                              label={t("settings.accountClosureRequest", "Account Closure Request")}
                              onClick={() => router.push("/dashboard/coming-soon")}
                            />
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <MobileBottomDock />
          </main>
        </div>

        {avatarModalOpen && (
          <div className="settings-modal-overlay" onClick={() => {
            setAvatarModalOpen(false);
            setAvatarError("");
          }}>
            <div className="settings-modal settings-modal--avatar" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal__header">
                <div className="settings-modal__title-wrap">
                  <span className="settings-modal__icon">
                    <i className="fa-solid fa-image" />
                  </span>
                  <h3>Upload Profile Picture</h3>
                </div>
                <button className="settings-modal__close" onClick={() => setAvatarModalOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <p className="settings-modal__description">
                Choose an image and confirm with Upload. The new picture is saved when you click Save Changes.
              </p>

              <div className="settings-modal__body">
                {!avatarDraftPreview ? (
                  <label className="settings-avatar-dropzone">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => handleAvatarDraftFile(event.target.files?.[0] || null)}
                    />
                    <i className="fa-solid fa-cloud-arrow-up" />
                    <span>Click to choose JPG, PNG, or WEBP</span>
                    <small>Maximum size: 5MB</small>
                  </label>
                ) : (
                  <div className="settings-avatar-preview-card">
                    <button type="button" className="settings-avatar-remove" onClick={clearAvatarDraft} aria-label="Remove draft image">
                      <i className="fa-solid fa-xmark" />
                    </button>
                    <img src={avatarDraftPreview} alt="Avatar preview" className="settings-avatar-preview-image" />
                  </div>
                )}

                {avatarError && (
                  <div style={{ marginTop: "12px", color: "#ff7aa5", fontSize: "0.9rem", fontWeight: "600" }}>
                    {avatarError}
                  </div>
                )}
              </div>

              <div className="settings-modal__footer">
                <button className="settings-btn settings-btn--ghost" onClick={() => setAvatarModalOpen(false)}>
                  <i className="fa-solid fa-ban" />
                  <span>Cancel</span>
                </button>
                <button className="settings-btn settings-btn--primary" onClick={applyAvatarDraft}>
                  <i className="fa-solid fa-upload" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {pwModalOpen && (
          <div className="settings-modal-overlay" onClick={() => setPwModalOpen(false)}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal__header">
                <div className="settings-modal__title-wrap">
                  <span className="settings-modal__icon">
                    <i className="fa-solid fa-key" />
                  </span>
                  <h3>Change Password</h3>
                </div>
                <button className="settings-modal__close" onClick={() => setPwModalOpen(false)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <p className="settings-modal__description">
                For security, use a strong password you have not used anywhere else.
              </p>

              <div className="settings-modal__body">
                <div className="settings-field-grid settings-field-grid--single">
                  <label className="settings-label-group">
                    <span>Current Password</span>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                    />
                  </label>
                  <label className="settings-label-group">
                    <span>New Password</span>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                    />
                  </label>
                  <label className="settings-label-group">
                    <span>Confirm New Password</span>
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                    />
                  </label>
                </div>

                {pwMessage.text && (
                  <div style={{ marginTop: "12px", color: pwMessage.type === "error" ? "#ff7aa5" : "#4ade80", fontSize: "0.9rem", fontWeight: "600" }}>
                    {pwMessage.text}
                  </div>
                )}
              </div>

              <div className="settings-modal__footer">
                <button className="settings-btn settings-btn--ghost" onClick={() => setPwModalOpen(false)}>
                  <i className="fa-solid fa-ban" />
                  <span>Cancel</span>
                </button>
                <button
                  className="settings-btn settings-btn--primary"
                  onClick={handlePasswordChange}
                  disabled={pwLoading}
                >
                  <i className="fa-solid fa-shield-halved" />
                  <span>{pwLoading ? "Updating..." : "Update Password"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LocalizationProvider>
  );
}
