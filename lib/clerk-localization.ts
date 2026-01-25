import type { LocalizationResource } from "@clerk/types";

export const srLocalization: LocalizationResource = {
  locale: "sr-RS",
  socialButtonsBlockButton: "Nastavi sa {{provider|titleize}}",
  lastAuthenticationStrategy: "Poslednji put",
  badge__default: "Podrazumevano",
  badge__otherImpersonatorDevice: "Drugi uredjaj",
  badge__primary: "Primarno",
  badge__requiresAction: "Zahteva akciju",
  badge__thisDevice: "Ovaj uredjaj",
  badge__unverified: "Neverifikovano",
  badge__userDevice: "Korisnicki uredjaj",
  badge__you: "Vi",
  dividerText: "ili",
  formFieldLabel__emailAddress: "Email adresa",
  formFieldLabel__emailAddresses: "Email adrese",
  formFieldLabel__phoneNumber: "Broj telefona",
  formFieldLabel__username: "Korisnicko ime",
  formFieldLabel__emailAddress_username: "Email adresa ili korisnicko ime",
  formFieldLabel__password: "Lozinka",
  formFieldLabel__currentPassword: "Trenutna lozinka",
  formFieldLabel__newPassword: "Nova lozinka",
  formFieldLabel__confirmPassword: "Potvrdi lozinku",
  formFieldLabel__signOutOfOtherSessions: "Odjavi se sa svih drugih uredjaja",
  formFieldLabel__firstName: "Ime",
  formFieldLabel__lastName: "Prezime",
  formFieldLabel__backupCode: "Rezervni kod",
  formFieldLabel__organizationName: "Naziv organizacije",
  formFieldLabel__organizationSlug: "URL slug",
  formFieldLabel__role: "Uloga",
  formFieldInputPlaceholder__emailAddress: "Unesite vasu email adresu",
  formFieldInputPlaceholder__emailAddresses:
    "Unesite ili nalepite email adrese, odvojene razmacima ili zarezima",
  formFieldInputPlaceholder__phoneNumber: "Unesite vas broj telefona",
  formFieldInputPlaceholder__username: "Unesite korisnicko ime",
  formFieldInputPlaceholder__emailAddress_username:
    "Unesite email adresu ili korisnicko ime",
  formFieldInputPlaceholder__password: "Unesite lozinku",
  formFieldInputPlaceholder__firstName: "Unesite vase ime",
  formFieldInputPlaceholder__lastName: "Unesite vase prezime",
  formFieldInputPlaceholder__backupCode: "Unesite rezervni kod",
  formFieldInputPlaceholder__organizationName: "Naziv organizacije",
  formFieldInputPlaceholder__organizationSlug: "moja-organizacija",
  formFieldAction__forgotPassword: "Zaboravili ste lozinku?",
  formButtonPrimary: "Nastavi",
  signIn: {
    start: {
      title: "Prijavite se",
      subtitle: "Dobrodosli nazad! Prijavite se da nastavite",
      actionText: "Nemate nalog?",
      actionLink: "Registrujte se",
    },
    emailCode: {
      title: "Proverite svoju email postu",
      subtitle: "da nastavite ka {{applicationName}}",
      formTitle: "Verifikacioni kod",
      resendButton: "Niste dobili kod? Posalji ponovo",
    },
    emailLink: {
      title: "Proverite svoju email postu",
      subtitle: "da nastavite ka {{applicationName}}",
      formTitle: "Verifikacioni link",
      resendButton: "Niste dobili link? Posalji ponovo",
      unusedTab: {
        title: "Mozete zatvoriti ovaj tab",
      },
      verified: {
        title: "Uspesno prijavljivanje",
        subtitle: "Bicesete preusmereni uskoro",
      },
      verifiedSwitchTab: {
        subtitle: "Vratite se na originalni tab da nastavite",
        titleNewTab: "Prijavljeni ste na drugom tabu",
        subtitleNewTab: "Vratite se na novotvoren tab da nastavite",
      },
      loading: {
        title: "Prijavljivanje...",
        subtitle: "Bicesete preusmereni uskoro",
      },
      failed: {
        title: "Ovaj verifikacioni link je nevazeci",
        subtitle: "Vratite se na originalni tab da nastavite.",
      },
      expired: {
        title: "Ovaj verifikacioni link je istekao",
        subtitle: "Vratite se na originalni tab da nastavite.",
      },
    },
    password: {
      title: "Unesite svoju lozinku",
      subtitle: "Unesite lozinku povezanu sa vasim nalogom",
      actionLink: "Koristite drugi metod",
    },
    forgotPasswordAlternativeMethods: {
      title: "Zaboravili ste lozinku?",
      label__alternativeMethods: "Ili, prijavite se drugim metodom.",
      blockButton__resetPassword: "Resetujte svoju lozinku",
    },
    forgotPassword: {
      title: "Resetujte lozinku",
      subtitle: "da nastavite ka {{applicationName}}",
      subtitle_email: "Za pocetak, unesite kod poslat na vas email",
      subtitle_phone: "Za pocetak, unesite kod poslat na vas telefon",
      formTitle: "Kod za resetovanje lozinke",
      resendButton: "Niste dobili kod? Posalji ponovo",
    },
    resetPassword: {
      title: "Resetujte lozinku",
      formButtonPrimary: "Resetuj lozinku",
      successMessage:
        "Vasa lozinka je uspesno promenjena. Prijavljivanje, sacekajte trenutak...",
    },
    resetPasswordMfa: {
      detailsLabel: "Moramo potvrditi vas identitet pre resetovanja lozinke.",
    },
    phoneCode: {
      title: "Proverite vas telefon",
      subtitle: "da nastavite ka {{applicationName}}",
      formTitle: "Verifikacioni kod",
      resendButton: "Niste dobili kod? Posalji ponovo",
    },
    phoneCodeMfa: {
      title: "Proverite vas telefon",
      subtitle: "",
      formTitle: "Verifikacioni kod",
      resendButton: "Niste dobili kod? Posalji ponovo",
    },
    totpMfa: {
      title: "Dvostepena verifikacija",
      subtitle: "",
      formTitle: "Verifikacioni kod",
    },
    backupCodeMfa: {
      title: "Unesite rezervni kod",
      subtitle: "da nastavite ka {{applicationName}}",
    },
    alternativeMethods: {
      title: "Koristite drugi metod",
      actionLink: "Pomoc",
      blockButton__emailLink: "Posaljite link na {{identifier}}",
      blockButton__emailCode: "Posaljite kod na {{identifier}}",
      blockButton__phoneCode: "Posaljite SMS kod na {{identifier}}",
      blockButton__password: "Prijavite se svojom lozinkom",
      blockButton__totp: "Koristite svoju autentifikatorsku aplikaciju",
      blockButton__backupCode: "Koristite rezervni kod",
      getHelp: {
        title: "Pomoc",
        content:
          "Ako imate problema sa prijavljivanjem na vas nalog, posaljite nam email i mi cemo raditi sa vama na obnovi pristupa sto je pre moguce.",
        blockButton__emailSupport: "Email podrska",
      },
    },
    noAvailableMethods: {
      title: "Prijavljivanje nije moguce",
      subtitle: "Doslo je do greske",
      message:
        "Prijavljivanje nije moguce. Nema dostupnih faktora autentifikacije.",
    },
  },
  signUp: {
    start: {
      title: "Kreirajte nalog",
      subtitle: "Dobrodosli! Unesite vase podatke da zapocnete.",
      actionText: "Vec imate nalog?",
      actionLink: "Prijavite se",
    },
    emailLink: {
      title: "Verifikujte vas email",
      subtitle: "da nastavite ka {{applicationName}}",
      formTitle: "Verifikacioni link",
      resendButton: "Niste dobili link? Posalji ponovo",
      verified: {
        title: "Uspesno verifikovano",
      },
      loading: {
        title: "Registracija...",
      },
      verifiedSwitchTab: {
        title: "Uspesno verifikovan email",
        subtitle: "Vratite se na novootvoreni tab da nastavite",
        subtitleNewTab: "Vratite se na prethodni tab da nastavite",
      },
    },
    emailCode: {
      title: "Verifikujte vas email",
      subtitle: "da nastavite ka {{applicationName}}",
      formTitle: "Verifikacioni kod",
      resendButton: "Niste dobili kod? Posalji ponovo",
    },
    phoneCode: {
      title: "Verifikujte vas telefon",
      subtitle: "da nastavite ka {{applicationName}}",
      formTitle: "Verifikacioni kod",
      resendButton: "Niste dobili kod? Posalji ponovo",
    },
    continue: {
      title: "Popunite preostala polja",
      subtitle: "da nastavite ka {{applicationName}}",
      actionText: "Vec imate nalog?",
      actionLink: "Prijavite se",
    },
  },
  userProfile: {
    mobileButton__menu: "Meni",
    formButtonPrimary__continue: "Nastavi",
    formButtonPrimary__finish: "Zavrsi",
    formButtonReset: "Otkazi",
    start: {
      headerTitle__account: "Nalog",
      headerTitle__security: "Bezbednost",
      profileSection: {
        title: "Profil",
      },
      usernameSection: {
        title: "Korisnicko ime",
        primaryButton__updateUsername: "Promenite korisnicko ime",
        primaryButton__setUsername: "Podesite korisnicko ime",
      },
      emailAddressesSection: {
        title: "Email adrese",
        primaryButton: "Dodajte email adresu",
        detailsAction__primary: "Primarna",
        detailsAction__nonPrimary: "Postavi kao primarnu",
        detailsAction__unverified: "Neverifikovana",
        destructiveAction: "Ukloni email",
      },
      phoneNumbersSection: {
        title: "Brojevi telefona",
        primaryButton: "Dodajte broj telefona",
        detailsAction__primary: "Primarni",
        detailsAction__nonPrimary: "Postavi kao primarni",
        detailsAction__unverified: "Neverifikovan",
        destructiveAction: "Ukloni broj telefona",
      },
      connectedAccountsSection: {
        title: "Povezani nalozi",
        primaryButton: "Povezite nalog",
        subtitle__reauthorize:
          "Potrebni dozvoli su azurirani i mozda imate ogranicen pristup. Molimo vas da ponovo autorizujete ovu aplikaciju da izbegnete bilo kakve probleme",
        actionLabel__connectionFailed: "Pokusajte ponovo",
        actionLabel__reauthorize: "Autorizujte sada",
        destructiveActionTitle: "Ukloni",
      },
      passwordSection: {
        title: "Lozinka",
        primaryButton__updatePassword: "Promenite lozinku",
        primaryButton__setPassword: "Podesite lozinku",
      },
      mfaSection: {
        title: "Dvostepena verifikacija",
        primaryButton: "Dodajte dvostepenu verifikaciju",
        phoneCode: {
          destructiveActionLabel: "Ukloni",
          actionLabel__setDefault: "Postavi kao podrazumevano",
        },
        backupCodes: {
          headerTitle: "Rezervni kodovi",
          title__regenerate: "Regenerisite rezervne kodove",
          subtitle__regenerate:
            "Dobijte novi set sigurnih rezervnih kodova. Prethodni rezervni kodovi ce biti obrisani i nece se moci koristiti.",
          actionLabel__regenerate: "Regenerisi kodove",
        },
        totp: {
          headerTitle: "Autentifikator aplikacija",
          destructiveActionTitle: "Ukloni",
        },
      },
      activeDevicesSection: {
        title: "Aktivni uredjaji",
        destructiveAction: "Odjavi se sa uredjaja",
      },
      dangerSection: {
        title: "Opasnost",
        deleteAccountButton: "Obrisite nalog",
      },
    },
    profilePage: {
      title: "Azurirajte profil",
      imageFormTitle: "Profilna slika",
      imageFormSubtitle: "Otpremite sliku",
      imageFormDestructiveActionSubtitle: "Uklonite sliku",
      fileDropAreaHint: "Preporucena velicina je 1:1 sa maksimumom od 10MB.",
      successMessage: "Vas profil je azuriran.",
    },
    usernamePage: {
      successMessage: "Vase korisnicko ime je azurirano.",
    },
    emailAddressPage: {
      title: "Dodajte email adresu",
      emailCode: {
        formTitle: "Verifikacioni kod",
        resendButton: "Niste dobili kod? Posalji ponovo",
        successMessage: "Email {{identifier}} je dodat na vas nalog.",
      },
      emailLink: {
        formTitle: "Verifikacioni link",
        resendButton: "Niste dobili link? Posalji ponovo",
        successMessage: "Email {{identifier}} je dodat na vas nalog.",
      },
      removeResource: {
        title: "Uklonite email adresu",
        messageLine1: "{{identifier}} ce biti uklonjen sa ovog naloga.",
        messageLine2: "Necete moci da se prijavite koristeci ovu email adresu.",
        successMessage: "{{emailAddress}} je uklonjen sa vaseg naloga.",
      },
    },
    phoneNumberPage: {
      title: "Dodajte broj telefona",
      successMessage: "{{identifier}} je dodat na vas nalog.",
      infoText:
        "Na ovaj broj telefona ce biti poslata tekstualna poruka sa verifikacionim linkom.",
      removeResource: {
        title: "Uklonite broj telefona",
        messageLine1: "{{identifier}} ce biti uklonjen sa ovog naloga.",
        messageLine2:
          "Necete moci da se prijavite koristeci ovaj broj telefona.",
        successMessage: "{{phoneNumber}} je uklonjen sa vaseg naloga.",
      },
    },
    connectedAccountPage: {
      title: "Dodajte povezani nalog",
      formHint: "Izaberite provajdera da povezete vas nalog.",
      formHint__noAccounts: "Nema dostupnih provajdera.",
      socialButtonsBlockButton: "Povezi {{provider|titleize}} nalog",
      successMessage: "Provajder je dodat na vas nalog",
      removeResource: {
        title: "Uklonite povezani nalog",
        messageLine1: "{{identifier}} ce biti uklonjen sa ovog naloga.",
        messageLine2:
          "Necete moci da koristite ovaj povezani nalog i sve zavisne funkcije vise nece raditi.",
        successMessage: "{{connectedAccount}} je uklonjen sa vaseg naloga.",
      },
    },
    mfaPage: {
      title: "Dodajte dvostepenu verifikaciju",
      formHint: "Izaberite metod za dodavanje.",
    },
    mfaTOTPPage: {
      title: "Dodajte autentifikator aplikaciju",
      verifyTitle: "Verifikacioni kod",
      verifySubtitle:
        "Unesite verifikacioni kod generisan od strane vaseg autentifikatora",
      successMessage:
        "Dvostepena verifikacija je sada omogucena. Prilikom prijavljivanja, moracete da unesete verifikacioni kod iz ovog autentifikatora kao dodatni korak.",
      authenticatorApp: {
        infoText__ableToScan:
          "Podesite novi metod prijavljivanja u vasoj autentifikator aplikaciji i skenirajte sledeci QR kod da ga povezete sa vasim nalogom.",
        infoText__unableToScan:
          "Podesite novi metod prijavljivanja u vasem autentifikatoru i unesite kljuc ispod.",
        inputLabel__unableToScan1:
          "Uverite se da su vremenski bazirane ili jednokratne lozinke omogucene, zatim zavrsitepovezivanje vaseg naloga.",
        inputLabel__unableToScan2:
          "Alternativno, ako vas autentifikator podrzava TOTP URI-je, mozete takodje kopirati pun URI.",
        buttonAbleToScan__nonPrimary: "Skenirajte QR kod umesto toga",
        buttonUnableToScan__nonPrimary: "Ne mozete skenirati QR kod?",
      },
    },
    mfaPhoneCodePage: {
      title: "Dodajte SMS kod verifikaciju",
      primaryButton__addPhoneNumber: "Dodajte broj telefona",
      backButton: "Nazad",
      subtitle__availablePhoneNumbers:
        "Izaberite broj telefona za registraciju SMS kod dvostepene verifikacije.",
      subtitle__unavailablePhoneNumbers:
        "Nema dostupnih brojeva telefona za registraciju SMS kod dvostepene verifikacije.",
      successTitle: "Uspesno",
      successMessage1:
        "SMS kod dvostepena verifikacija je sada omogucena za ovaj broj telefona.",
      successMessage2:
        "Prilikom prijavljivanja, moracete da unesete verifikacioni kod poslat na ovaj broj telefona kao dodatni korak.",
    },
    backupCodePage: {
      title: "Dodajte verifikaciju rezervnim kodom",
      title__codelist: "Rezervni kodovi",
      subtitle__codelist: "Cuvajte ih na sigurnom i drzite ih tajnim.",
      infoText1: "Rezervni kodovi ce biti omoguceni za ovaj nalog.",
      infoText2:
        "Drzite rezervne kodove tajnim i cuvajte ih na sigurnom. Mozete regenerisati rezervne kodove ako sumnjate da su kompromitovani.",
      successSubtitle:
        "Mozete koristiti jedan od ovih za prijavljivanje na vas nalog, ako izgubite pristup vasem autentifikacionom uredjaju.",
      successMessage:
        "Rezervni kodovi su sada omoguceni. Mozete koristiti jedan od ovih za prijavljivanje na vas nalog, ako izgubite pristup vasem autentifikacionom uredjaju. Svaki kod se moze koristiti samo jednom.",
      actionLabel__copy: "Kopiraj sve",
      actionLabel__copied: "Kopirano!",
      actionLabel__download: "Preuzmi .txt",
      actionLabel__print: "Stampaj",
    },
    deletePage: {
      title: "Obrisite nalog",
      messageLine1: "Da li ste sigurni da zelite da obrisete vas nalog?",
      messageLine2: "Ova akcija je trajna i nepovratna.",
      confirm: "Obrisi nalog",
    },
  },
  userButton: {
    action__manageAccount: "Upravljajte nalogom",
    action__signOut: "Odjavi se",
    action__signOutAll: "Odjavi se sa svih naloga",
    action__addAccount: "Dodajte nalog",
  },
  organizationSwitcher: {
    personalWorkspace: "Licni prostor",
    notSelected: "Nije izabrana organizacija",
    action__createOrganization: "Kreirajte organizaciju",
    action__manageOrganization: "Upravljajte organizacijom",
  },
  impersonationFab: {
    title: "Prijavljeni ste kao {{identifier}}",
    action__signOut: "Odjavi se",
  },
  footerPageLink__help: "Pomoc",
  footerPageLink__privacy: "Privatnost",
  footerPageLink__terms: "Uslovi",
  paginationButton__previous: "Prethodno",
  paginationButton__next: "Sledece",
  paginationRowText__displaying: "Prikazuje se",
  paginationRowText__of: "od",
  membershipRole__admin: "Admin",
  membershipRole__basicMember: "Clan",
  membershipRole__guestMember: "Gost",
};
