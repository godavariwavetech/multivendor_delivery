/**
 * Routes served by the backend's `/partner_app` router
 * (D:\projects\multivendor_backend\partner_app\routes\routes.js).
 *
 * Sign-in routes are public; everything else needs the Bearer token, and the
 * vendor/delivery groups reject a token issued for the other workspace.
 */
export const endpoints = {
  auth: {
    login: '/login',
    sendOtp: '/sendotp',
    verifyOtp: '/verifyotp',
    resetPassword: '/resetpassword',
    account: '/getaccount',
    branding: '/getbranding',
    switchRole: '/switchrole',
    updateBank: '/updatebankaccount',
    support: '/getsupport',
    raiseTicket: '/raiseticket',
    accountRequests: '/getaccountrequests',
    requestDeletion: '/requestaccountdeletion',
    requestExport: '/requestdataexport',
    registerDevice: '/registerdevice',
    unregisterDevice: '/unregisterdevice',
  },
  vendor: {
    state: '/getvendorstate',
    history: '/getvendorhistory',
    storeOnline: '/updatestoreonline',
    storeBusy: '/updatestorebusy',
    weeklyHoliday: '/updateweeklyholiday',
    storeHours: '/updatestorehours',
    acceptOrder: '/acceptorder',
    rejectOrder: '/rejectorder',
    extendPrepTime: '/extendpreptime',
    markReady: '/markorderready',
    handover: '/confirmhandover',
    productAvailability: '/updateproductavailability',
    saveProduct: '/saveproduct',
    publishRates: '/publishrates',
    substitution: '/updatesubstitution',
    daypart: '/updatedaypart',
    uploadProductImage: '/uploadproductimage',
    saveCoupon: '/savecoupon',
    toggleCoupon: '/togglecoupon',
    preferences: '/vendor/updatepreferences',
    readNotifications: '/vendor/readnotifications',
  },
  delivery: {
    state: '/getpartnerstate',
    online: '/updateonline',
    acceptRequest: '/acceptrequest',
    rejectRequest: '/rejectrequest',
    reachedStore: '/reachedstore',
    confirmPickup: '/confirmpickup',
    arrived: '/arrivedcustomer',
    complete: '/completedelivery',
    fail: '/faildelivery',
    rateHandover: '/ratehandover',
    uploadProof: '/uploadproof',
    preferences: '/updatepreferences',
    readNotifications: '/delivery/readnotifications',
  },
} as const;
