export type TranslationKey =
  | "nav.casino"
  | "nav.sports"
  | "nav.live"
  | "nav.promotions"
  | "nav.mines"
  | "nav.limbo"
  | "nav.coinflip"
  | "nav.search"
  | "nav.wallet"
  | "nav.vipClub"
  | "nav.bonus"
  | "nav.referral"
  | "nav.form"
  | "nav.responsibleGambling"
  | "mobile.home"
  | "mobile.more"
  | "mobile.close"
  | "mobile.alerts"
  | "mobile.settings"
  | "aria.mobileBottomDock"
  | "aria.openMoreMenu"
  | "aria.closeMoreMenu"
  | "aria.search"
  | "aria.notifications"
  | "aria.settings"
  | "aria.profile"
  | "profile.panelTitle"
  | "profile.panelSubtitle"
  | "profile.walletBalance"
  | "profile.displayName"
  | "profile.email"
  | "profile.phone"
  | "profile.country"
  | "profile.language"
  | "profile.dateOfBirth"
  | "profile.logout"
  | "common.na"
  | "settings.title"
  | "settings.subtitle"
  | "settings.accountProfile"
  | "settings.accountDescription"
  | "settings.displayName"
  | "settings.username"
  | "settings.email"
  | "settings.phoneNumber"
  | "settings.dateOfBirth"
  | "settings.selectDateOfBirth"
  | "settings.countryRegion"
  | "settings.preferredLanguage"
  | "settings.enterDisplayName"
  | "settings.enterUsername"
  | "settings.enterEmail"
  | "settings.enterPhoneNumber"
  | "settings.selectCode"
  | "settings.selectCountryRegion"
  | "settings.selectPreferredLanguage"
  | "settings.profilePicture"
  | "settings.search"
  | "settings.optionalAvatarHelp"
  | "settings.pendingAvatarHelp"
  | "settings.changeUpload"
  | "settings.uploadImage"
  | "settings.saving"
  | "settings.saveChanges"
  | "settings.noChangesYet"
  | "settings.securitySettings"
  | "settings.changePassword"
  | "settings.twoFactor"
  | "settings.loginActivity"
  | "settings.notificationsPreferences"
  | "settings.receiveEmail"
  | "settings.account"
  | "settings.offers"
  | "settings.smsNotifications"
  | "settings.pushNotifications"
  | "settings.promotionalOffers"
  | "settings.supportHelp"
  | "settings.contactSupport"
  | "settings.liveChat"
  | "settings.faq"
  | "settings.reportProblem"
  | "settings.accountClosureRequest";

type TranslationMap = Record<string, string>;

const en: TranslationMap = {
  "nav.casino": "Casino",
  "nav.sports": "Sports",
  "nav.live": "Live",
  "nav.promotions": "Promotions",
  "nav.mines": "Mines",
  "nav.limbo": "Limbo",
  "nav.coinflip": "Coinflip",
  "nav.search": "Search",
  "nav.wallet": "Wallet",
  "nav.vipClub": "VIP Club",
  "nav.bonus": "Bonus",
  "nav.referral": "Referral",
  "nav.form": "Form",
  "nav.responsibleGambling": "Responsible Gambling",
  "mobile.home": "Home",
  "mobile.more": "More",
  "mobile.close": "Close",
  "mobile.alerts": "Alerts",
  "mobile.settings": "Settings",
  "aria.mobileBottomDock": "Mobile bottom dock",
  "aria.openMoreMenu": "Open more menu",
  "aria.closeMoreMenu": "Close more menu",
  "aria.search": "Search",
  "aria.notifications": "Notifications",
  "aria.settings": "Settings",
  "aria.profile": "Profile",
  "profile.panelTitle": "My Profile",
  "profile.panelSubtitle": "Account details and preferences",
  "profile.walletBalance": "Wallet Balance",
  "profile.displayName": "Display Name",
  "profile.email": "Email",
  "profile.phone": "Phone",
  "profile.country": "Country",
  "profile.language": "Language",
  "profile.dateOfBirth": "Date of Birth",
  "profile.logout": "Logout",
  "common.na": "N/A",
  "settings.title": "Settings",
  "settings.subtitle": "Manage your profile, security, preferences, and support options.",
  "settings.accountProfile": "Account / Profile",
  "settings.accountDescription": "Core identity and personal information.",
  "settings.displayName": "Display Name",
  "settings.username": "Username",
  "settings.email": "Email Address",
  "settings.phoneNumber": "Phone Number",
  "settings.dateOfBirth": "Date of Birth",
  "settings.selectDateOfBirth": "Select date of birth",
  "settings.countryRegion": "Country / Region",
  "settings.preferredLanguage": "Preferred Language",
  "settings.enterDisplayName": "Enter display name",
  "settings.enterUsername": "Enter username",
  "settings.enterEmail": "Enter email",
  "settings.enterPhoneNumber": "Enter phone number",
  "settings.selectCode": "Select code",
  "settings.selectCountryRegion": "Select country / region",
  "settings.selectPreferredLanguage": "Select preferred language",
  "settings.profilePicture": "Profile Picture",
  "settings.search": "Search...",
  "settings.optionalAvatarHelp": "Optional. JPG, PNG or WEBP. Max 5MB.",
  "settings.pendingAvatarHelp": "New image selected. Save Changes to upload.",
  "settings.changeUpload": "Change Upload",
  "settings.uploadImage": "Upload Image",
  "settings.saving": "Saving...",
  "settings.saveChanges": "Save Changes",
  "settings.noChangesYet": "No changes yet.",
  "settings.securitySettings": "Security Settings",
  "settings.changePassword": "Change Password",
  "settings.twoFactor": "Two-Factor Authentication",
  "settings.loginActivity": "Login Activity / Session History",
  "settings.notificationsPreferences": "Notifications & Preferences",
  "settings.receiveEmail": "I want to receive these in my Email",
  "settings.account": "Account",
  "settings.offers": "Offers",
  "settings.smsNotifications": "SMS Notifications",
  "settings.pushNotifications": "Push Notifications",
  "settings.promotionalOffers": "Promotional Offers",
  "settings.supportHelp": "Support & Help",
  "settings.contactSupport": "Contact Support",
  "settings.liveChat": "Live Chat",
  "settings.faq": "FAQ",
  "settings.reportProblem": "Report a Problem",
  "settings.accountClosureRequest": "Account Closure Request",
};

const es: Partial<TranslationMap> = {
  "nav.casino": "Casino",
  "nav.sports": "Deportes",
  "nav.live": "En vivo",
  "nav.promotions": "Promociones",
  "nav.mines": "Minas",
  "nav.limbo": "Limbo",
  "nav.coinflip": "Cara o cruz",
  "nav.search": "Buscar",
  "nav.wallet": "Billetera",
  "mobile.home": "Inicio",
  "mobile.more": "Mas",
  "mobile.close": "Cerrar",
  "mobile.alerts": "Alertas",
  "mobile.settings": "Ajustes",
  "profile.panelTitle": "Mi perfil",
  "profile.panelSubtitle": "Detalles de cuenta y preferencias",
  "profile.walletBalance": "Saldo de billetera",
  "profile.displayName": "Nombre visible",
  "profile.email": "Correo",
  "profile.phone": "Telefono",
  "profile.country": "Pais",
  "profile.language": "Idioma",
  "profile.dateOfBirth": "Fecha de nacimiento",
  "profile.logout": "Cerrar sesion",
  "settings.title": "Ajustes",
  "settings.subtitle": "Administra tu perfil, seguridad, preferencias y soporte.",
  "settings.accountProfile": "Cuenta / Perfil",
  "settings.accountDescription": "Identidad principal e informacion personal.",
  "settings.displayName": "Nombre visible",
  "settings.username": "Usuario",
  "settings.email": "Correo electronico",
  "settings.phoneNumber": "Numero de telefono",
  "settings.dateOfBirth": "Fecha de nacimiento",
  "settings.countryRegion": "Pais / Region",
  "settings.preferredLanguage": "Idioma preferido",
  "settings.profilePicture": "Foto de perfil",
};

const hi: Partial<TranslationMap> = {
  "nav.casino": "Casino",
  "nav.sports": "Sports",
  "nav.live": "Live",
  "nav.promotions": "Offers",
  "nav.mines": "Mines",
  "nav.limbo": "Limbo",
  "nav.coinflip": "Coinflip",
  "nav.search": "Search",
  "nav.wallet": "Wallet",
  "mobile.home": "Home",
  "mobile.more": "More",
  "mobile.close": "Close",
  "mobile.alerts": "Alerts",
  "mobile.settings": "Settings",
  "profile.panelTitle": "My Profile",
  "profile.panelSubtitle": "Account details and preferences",
  "profile.walletBalance": "Wallet Balance",
  "profile.displayName": "Display Name",
  "profile.email": "Email",
  "profile.phone": "Phone",
  "profile.country": "Country",
  "profile.language": "Language",
  "profile.dateOfBirth": "Date of Birth",
  "profile.logout": "Logout",
  "settings.title": "Settings",
  "settings.subtitle": "Manage your profile, security, preferences, and support options.",
  "settings.accountProfile": "Account / Profile",
  "settings.accountDescription": "Core identity and personal information.",
};

const fr: Partial<TranslationMap> = {
  "nav.casino": "Casino",
  "nav.sports": "Sports",
  "nav.live": "Direct",
  "nav.promotions": "Promotions",
  "nav.mines": "Mines",
  "nav.limbo": "Limbo",
  "nav.coinflip": "Pile ou face",
  "nav.search": "Rechercher",
  "nav.wallet": "Portefeuille",
  "nav.vipClub": "Club VIP",
  "nav.bonus": "Bonus",
  "nav.referral": "Parrainage",
  "nav.form": "Formulaire",
  "nav.responsibleGambling": "Jeu responsable",
  "mobile.home": "Accueil",
  "mobile.more": "Plus",
  "mobile.close": "Fermer",
  "mobile.alerts": "Alertes",
  "mobile.settings": "Parametres",
  "aria.mobileBottomDock": "Dock mobile",
  "aria.openMoreMenu": "Ouvrir plus de menu",
  "aria.closeMoreMenu": "Fermer le menu",
  "aria.search": "Rechercher",
  "aria.notifications": "Notifications",
  "aria.settings": "Parametres",
  "aria.profile": "Profil",
  "profile.panelTitle": "Mon profil",
  "profile.panelSubtitle": "Details du compte et preferences",
  "profile.walletBalance": "Solde du portefeuille",
  "profile.displayName": "Nom affiche",
  "profile.email": "E-mail",
  "profile.phone": "Telephone",
  "profile.country": "Pays",
  "profile.language": "Langue",
  "profile.dateOfBirth": "Date de naissance",
  "profile.logout": "Deconnexion",
  "common.na": "N/A",
  "settings.title": "Parametres",
  "settings.subtitle": "Gerez votre profil, securite, preferences et options de support.",
  "settings.accountProfile": "Compte / Profil",
  "settings.accountDescription": "Informations principales d'identite et personnelles.",
  "settings.displayName": "Nom affiche",
  "settings.username": "Nom d'utilisateur",
  "settings.email": "Adresse e-mail",
  "settings.phoneNumber": "Numero de telephone",
  "settings.dateOfBirth": "Date de naissance",
  "settings.selectDateOfBirth": "Selectionner la date de naissance",
  "settings.countryRegion": "Pays / Region",
  "settings.preferredLanguage": "Langue preferee",
  "settings.enterDisplayName": "Saisir le nom affiche",
  "settings.enterUsername": "Saisir le nom d'utilisateur",
  "settings.enterEmail": "Saisir l'e-mail",
  "settings.enterPhoneNumber": "Saisir le numero de telephone",
  "settings.selectCode": "Selectionner le code",
  "settings.selectCountryRegion": "Selectionner le pays / region",
  "settings.selectPreferredLanguage": "Selectionner la langue preferee",
  "settings.profilePicture": "Photo de profil",
  "settings.search": "Rechercher...",
  "settings.optionalAvatarHelp": "Optionnel. JPG, PNG ou WEBP. Max 5MB.",
  "settings.pendingAvatarHelp": "Nouvelle image selectionnee. Enregistrez pour televerser.",
  "settings.changeUpload": "Changer l'image",
  "settings.uploadImage": "Televerser l'image",
  "settings.saving": "Enregistrement...",
  "settings.saveChanges": "Enregistrer les modifications",
  "settings.noChangesYet": "Aucun changement pour le moment.",
  "settings.securitySettings": "Parametres de securite",
  "settings.changePassword": "Changer le mot de passe",
  "settings.twoFactor": "Authentification a deux facteurs",
  "settings.loginActivity": "Activite de connexion / Historique de session",
  "settings.notificationsPreferences": "Notifications et preferences",
  "settings.receiveEmail": "Je veux recevoir ceci par e-mail",
  "settings.account": "Compte",
  "settings.offers": "Offres",
  "settings.smsNotifications": "Notifications SMS",
  "settings.pushNotifications": "Notifications push",
  "settings.promotionalOffers": "Offres promotionnelles",
  "settings.supportHelp": "Support et aide",
  "settings.contactSupport": "Contacter le support",
  "settings.liveChat": "Chat en direct",
  "settings.faq": "FAQ",
  "settings.reportProblem": "Signaler un probleme",
  "settings.accountClosureRequest": "Demande de fermeture du compte",
};

export const TRANSLATIONS: Record<string, Partial<TranslationMap>> = {
  en,
  es,
  hi,
  fr,
};

export const FALLBACK_LANGUAGE = "en";
