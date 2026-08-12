Import {
    Auth,
    Database
} from "./firebase.js";

Import {
    OnAuthStateChanged,
    SignOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

Import {
    Ref,
    Get,
    Push,
    Set
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";



/* =========================================================
   ELEMENTS
========================================================= */

Const userName =
    Document.getElementById("userName");

Const walletBalance =
    Document.getElementById("walletBalance");

Const ordersCount =
    Document.getElementById("ordersCount");

Const recentOrders =
    Document.getElementById("recentOrders");

Const logoutBtn =
    Document.getElementById("logout");

Const redeemVoucherForm =
    Document.getElementById("redeemVoucherForm");

Const redeemCodeInput =
    Document.getElementById("redeemCodeInput");

Const redeemMsg =
    Document.getElementById("redeemMsg");

Const referralLinkInput =
    Document.getElementById("referralLinkInput");

Const copyRefBtn =
    Document.getElementById("copyRefBtn");

Const totalReferralsEl =
    Document.getElementById("totalReferrals");

Const totalEarningsEl =
    Document.getElementById("totalEarnings");



/* =========================================================
   FORMAT NAIRA
========================================================= */

Function formatNaira(amount) {

    Return "₦" +
        Number(amount || 0).toLocaleString(
            "en-NG",
            {
                MinimumFractionDigits: 2,
                MaximumFractionDigits: 2
            }
        );

}



/* =========================================================
   FORMAT DATE
========================================================= */

Function formatDate(timestamp) {

    If (!timestamp) {

        Return "—";

    }


    Return new Date(timestamp).toLocaleString(
        "en-NG",
        {
            DateStyle: "medium",
            TimeStyle: "short"
        }
    );

}



/* =========================================================
   STATUS BADGE
========================================================= */

Function statusBadge(status) {

    Const safeStatus =
        String(
            Status || "pending"
        ).toLowerCase()
         .trim();

    Let badgeClass = "bg-warning text-dark";
    Let displayText = "Refunded";

    If (safeStatus === "refund" || safeStatus === "refunded") {
        BadgeClass = "bg-warning text-dark";
        DisplayText = "Refunded";
    } else if (safeStatus === "pending") {
        BadgeClass = "bg-warning text-dark";
        DisplayText = "Pending";
    } else if (safeStatus === "processing") {
        BadgeClass = "bg-info text-dark";
        DisplayText = "Processing";
    } else if (safeStatus === "completed") {
        BadgeClass = "bg-success";
        DisplayText = "Completed";
    } else if (safeStatus === "cancelled" || safeStatus === "failed") {
        BadgeClass = "bg-danger";
        DisplayText = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    } else {
        BadgeClass = "bg-warning text-dark";
        DisplayText = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
    }

    Return `
        <span class="badge ${badgeClass}">
            ${displayText}
        </span>
    `;

}



/* =========================================================
   LOAD USER INFORMATION
========================================================= */

Async function loadUserInformation(user) {

    Try {

        Const userRef =
            Ref(
                Database,
                "users/" + user.uid
            );


        Const snapshot =
            Await get(userRef);


        If (!snapshot.exists()) {

            Console.warn(
                "USER DATA NOT FOUND"
            );


            If (userName) {

                UserName.textContent =
                    User.displayName ||
                    "User";

            }


            Return;

        }


        Const data =
            Snapshot.val();


        If (userName) {

            UserName.textContent =
                Data.fullName ||
                User.displayName ||
                "User";

        }


        /*
            UPDATE WALLET ONLY WHEN
            REAL USER DATA EXISTS
        */

        If (walletBalance) {

            WalletBalance.textContent =
                FormatNaira(
                    Data.wallet
                );

        }


    } catch (error) {

        Console.error(
            "USER DATA ERROR:",
            Error
        );


        If (userName) {

            UserName.textContent =
                User.displayName ||
                "User";

        }

    }

}



/* =========================================================
   LOAD REFERRAL INFORMATION (CUSTOM XYZ DOMAIN)
========================================================= */

Async function loadReferralInformation(uid) {

    Try {

        Const userRef =
            Ref(
                Database,
                "users/" + uid
            );

        Const snapshot =
            Await get(userRef);

        If (snapshot.exists()) {

            Const data =
                Snapshot.val();

            Const refCode =
                Data.referralCode || uid;

            If (referralLinkInput) {
                ReferralLinkInput.value =
                    `https://hkdmservices.xyz/register.html?ref=${refCode}`;
            }

            If (totalReferralsEl) {
                TotalReferralsEl.textContent =
                    Data.totalReferrals || 0;
            }

            If (totalEarningsEl) {
                TotalEarningsEl.textContent =
                    FormatNaira(data.totalReferralEarnings || 0);
            }

        }

    } catch (error) {

        Console.error(
            "REFERRAL DATA ERROR:",
            Error
        );

    }

}



/* =========================================================
   COPY REFERRAL LINK
========================================================= */

If (copyRefBtn && referralLinkInput) {

    CopyRefBtn.addEventListener("click", () => {

        If (!referralLinkInput.value || referralLinkInput.value.includes("Generating")) return;

        Navigator.clipboard.writeText(referralLinkInput.value).then(() => {
            CopyRefBtn.textContent = "Copied!";
            CopyRefBtn.classList.remove("btn-success");
            CopyRefBtn.classList.add("btn-dark");

            SetTimeout(() => {
                CopyRefBtn.textContent = "Copy Link";
                CopyRefBtn.classList.remove("btn-dark");
                CopyRefBtn.classList.add("btn-success");
            }, 2000);
        });

    });

}



/* =========================================================
   LOAD ORDERS
========================================================= */

Async function loadRecentOrders(uid) {

    Try {

        Const ordersRef =
            Ref(
                Database,
                "orders"
            );


        Const snapshot =
            Await get(
                OrdersRef
            );


        If (!snapshot.exists()) {

            If (ordersCount) {

                OrdersCount.textContent =
                    "0";

            }


            If (recentOrders) {

                RecentOrders.innerHTML = `

                    <div
                        Class="text-center
                        Text-muted
                        Py-4"
                    >

                        <i
                            Class="bi bi-cart-x fs-2"
                        ></i>

                        <p class="mt-2 mb-0">

                            You have not placed
                            Any orders yet.

                        </p>

                    </div>

                `;

            }


            Return;

        }


        Const orders =
            Snapshot.val();


        Const userOrders =
            Object.values(
                Orders
            )

            .filter(
                Order =>
                    Order &&
                    String(order.uid) ===
                    String(uid)
            )

            .sort(
                (a, b) =>
                    Number(
                        B.createdAt || 0
                    ) -
                    Number(
                        A.createdAt || 0
                    )
            );


        If (ordersCount) {

            OrdersCount.textContent =
                String(
                    UserOrders.length
                );

        }


        If (
            UserOrders.length === 0
        ) {

            If (recentOrders) {

                RecentOrders.innerHTML = `

                    <div
                        Class="text-center
                        Text-muted
                        Py-4"
                    >

                        <i
                            Class="bi bi-cart-x fs-2"
                        ></i>

                        <p class="mt-2 mb-0">

                            You have not placed
                            Any orders yet.

                        </p>

                    </div>

                `;

            }


            Return;

        }


        If (!recentOrders) {

            Return;

        }


        Const latestOrders =
            UserOrders.slice(
                0,
                5
            );


        Let desktopHtml = `

            <div class="d-none d-md-block">

                <div class="table-responsive">

                    <table
                        Class="table table-hover
                        Align-middle mb-0"
                    >

                        <thead>

                            <tr>

                                <th>
                                    Order ID
                                </th>

                                <th>
                                    Service
                                </th>

                                <th>
                                    Quantity
                                </th>

                                <th>
                                    Amount
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Date
                                </th>

                            </tr>

                        </thead>

                        <tbody>

        `;


        LatestOrders.forEach(
            Order => {

                Const shortOrderId =
                    String(
                        Order.orderId || ""
                    ).slice(
                        0,
                        10
                    );


                DesktopHtml += `

                    <tr>

                        <td>

                            <code>
                                ${shortOrderId}
                            </code>

                        </td>


                        <td>

                            <strong>

                                ${order.platform || "—"}

                            </strong>

                            <br>

                            <small
                                Class="text-muted"
                            >

                                ${order.service || "—"}

                            </small>

                        </td>


                        <td>

                            ${Number(
                                Order.quantity || 0
                            ).toLocaleString(
                                "en-NG"
                            )}

                        </td>


                        <td>

                            <strong>

                                ${formatNaira(
                                    Order.amount
                                )}

                            </strong>

                        </td>


                        <td>

                            ${statusBadge(
                                Order.status
                            )}

                        </td>


                        <td>

                            <small>

                                ${formatDate(
                                    Order.createdAt
                                )}

                            </small>

                        </td>

                    </tr>

                `;

            }
        );


        DesktopHtml += `

                        </tbody>

                    </table>

                </div>

            </div>

        `;


        Let mobileHtml = `

            <div class="d-md-none">

        `;


        LatestOrders.forEach(
            Order => {

                Const shortOrderId =
                    String(
                        Order.orderId || ""
                    ).slice(
                        0,
                        12
                    );


                MobileHtml += `

                    <div
                        Class="card border
                        Shadow-sm mb-3"
                    >

                        <div
                            Class="card-body"
                        >


                            <div
                                Class="d-flex
                                Justify-content-between
                                Align-items-start
                                Mb-3"
                            >

                                <div>

                                    <small
                                        Class="text-muted"
                                    >

                                        Order ID

                                    </small>

                                    <div>

                                        <code>

                                            ${shortOrderId}

                                        </code>

                                    </div>

                                </div>


                                <div>

                                    ${statusBadge(
                                        Order.status
                                    )}

                                </div>

                            </div>



                            <div class="mb-3">

                                <small
                                    Class="text-muted"
                                >

                                    Service

                                </small>

                                <div
                                    Class="fw-bold"
                                >

                                    ${order.platform || "—"}

                                </div>

                                <div
                                    Class="text-muted"
                                >

                                    ${order.service || "—"}

                                </div>

                            </div>



                            <div class="mb-3">

                                <small
                                    Class="text-muted"
                                >

                                    Quantity

                                </small>

                                <div
                                    Class="fw-bold"
                                >

                                    ${Number(
                                        Order.quantity || 0
                                    ).toLocaleString(
                                        "en-NG"
                                    )}

                                </div>

                            </div>



                            <div class="mb-3">

                                <small
                                    Class="text-muted"
                                >

                                    Amount

                                </small>

                                <div
                                    Class="fw-bold
                                    Text-success"
                                >

                                    ${formatNaira(
                                        Order.amount
                                    )}

                                </div>

                            </div>



                            <div>

                                <small
                                    Class="text-muted"
                                >

                                    Date

                                </small>

                                <div>

                                    ${formatDate(
                                        Order.createdAt
                                    )}

                                </div>

                            </div>


                        </div>

                    </div>

                `;

            }
        );


        MobileHtml += `

            </div>

        `;


        RecentOrders.innerHTML =
            DesktopHtml +
            mobileHtml;

    }


    catch (error) {

        Console.error(
            "ORDERS ERROR:",
            Error
        );


        If (recentOrders) {

            RecentOrders.innerHTML = `

                <div
                    Class="alert
                    Alert-warning
                    Mb-0"
                >

                    <i
                        Class="bi bi-wifi-off"
                    ></i>

                    Recent orders could not
                    Be loaded right now.

                    Please refresh the page.

                </div>

            `;

        }

    }

}



/* =========================================================
   REDEEM VOUCHER FUNCTIONALITY (SECURE API)
========================================================= */

If (redeemVoucherForm) {
    RedeemVoucherForm.addEventListener("submit", async (e) => {
        E.preventDefault();
        If (!redeemCodeInput) return;
        
        Const voucherCode = redeemCodeInput.value.trim();
        If (!voucherCode) return;

        If (redeemMsg) {
            RedeemMsg.innerHTML = `<div class="alert alert-info mb-0">Processing voucher...</div>`;
        }

        Try {
            If (!auth.currentUser) {
                Throw new Error("You must be logged in to redeem a voucher.");
            }

            Const idToken = await auth.currentUser.getIdToken(true);

            Const response = await fetch('/api/redeem-voucher', {
                Method: 'POST',
                Headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                Body: JSON.stringify({ voucherCode })
            });

            Const textResponse = await response.text();
            Let result;
            Try {
                Result = JSON.parse(textResponse);
            } catch (e) {
                Console.error("Non-JSON response received:", textResponse);
                Throw new Error("Server returned an invalid response format.");
            }

            If (!response.ok || !result.success) {
                Throw new Error(result.message || "Failed to redeem voucher.");
            }

            If (redeemMsg) {
                RedeemMsg.innerHTML = `<div class="alert alert-success mb-0">${result.message}</div>`;
            }
            RedeemVoucherForm.reset();
            
            Await loadUserInformation(auth.currentUser);
        } catch (error) {
            Console.error("REDEEM VOUCHER ERROR:", error);
            If (redeemMsg) {
                RedeemMsg.innerHTML = `<div class="alert alert-danger mb-0">${error.message}</div>`;
            }
        }
    });
}



/* =========================================================
   WHATSAPP SUPPORT FORM FUNCTIONALITY
========================================================= */

Const whatsappSupportForm = document.getElementById("whatsappSupportForm");

If (whatsappSupportForm) {
    WhatsappSupportForm.addEventListener("submit", (e) => {
        E.preventDefault();

        Const subjectInput = document.getElementById("waSubject");
        Const messageInput = document.getElementById("waMessage");

        If (!subjectInput || !messageInput) return;

        Const subject = subjectInput.value.trim();
        Const message = messageInput.value.trim();

        If (!subject || !message) return;

        Const currentUser = auth.currentUser;
        Const userEmail = currentUser ? currentUser.email : "Guest User";
        Const phoneNumber = "18253635037";

        Const text = `*New Support Message*%0A` +
                     `*From:* ${userEmail}%0A` +
                     `*Subject:* ${subject}%0A` +
                     `*Message:* ${message}`;

        Const whatsappUrl = `https://wa.me/${phoneNumber}?text=${text}`;
        Window.open(whatsappUrl, '_blank');

        WhatsappSupportForm.reset();
    });
}



/* =========================================================
   USER TIERS & UPGRADE SYSTEM (RESELLER SEPARATED)
========================================================= */

Async function evaluateAndRenderUserTier(userId) {
    Try {
        Const userRef = ref(database, `users/${userId}`);
        Const userSnap = await get(userRef);
        Const userData = userSnap.val() || {};
        Const currentTier = (userData.tier || 'regular').toLowerCase();
        Const totalSpent = Number(userData.totalSpent || 0);

        Const badgeEl = document.getElementById('user-current-tier-badge');
        Const resellerPromoSection = document.getElementById('resellerPromoSection');

        If (badgeEl) {
            BadgeEl.innerText = currentTier.toUpperCase();
            BadgeEl.className = "badge ";
            If (currentTier === 'reseller') {
                BadgeEl.classList.add('bg-danger');
            } else if (currentTier === 'vip') {
                BadgeEl.classList.add('bg-success');
            } else {
                BadgeEl.classList.add('bg-secondary');
            }
        }

        // If user is already a reseller, update the promo box
        If (currentTier === 'reseller') {
            If (resellerPromoSection) {
                ResellerPromoSection.innerHTML = `
                    <div class="col-12">
                        <div class="card p-3 shadow border-danger bg-light text-center">
                            <h5 class="text-danger mb-0"><i class="bi bi-patch-check-fill"></i> You are an Official Reseller! Enjoy your exclusive rates.</h5>
                        </div>
                    </div>
                `;
            }
        }

        Const actionContainer = document.getElementById('tier-action-container');
        If (!actionContainer) return;

        If (currentTier === 'reseller') {
            ActionContainer.innerHTML = `<span style="font-size: 0.8rem; color: #dc3545; display:block;"><i class="bi bi-patch-check-fill"></i> Reseller Status Active</span>`;
            Return;
        }

        // Check if there is already a pending request for VIP
        Const reqRef = ref(database, 'tierRequests');
        Const reqSnap = await get(reqRef);
        Let hasPending = false;
        
        If (reqSnap.exists()) {
            Const requests = reqSnap.val();
            Object.values(requests).forEach(req => {
                If (req && req.userId === userId && req.status === 'pending' && req.requestedTier === 'vip') {
                    HasPending = true;
                }
            });
        }

        If (hasPending) {
            ActionContainer.innerHTML = `<span style="font-size: 0.8rem; color: #ffc107; display:block;"><i class="bi bi-clock-history"></i> VIP Upgrade Request Pending</span>`;
            Return;
        }

        Let html = '';
        If (currentTier === 'regular') {
            If (totalSpent >= 60000) {
                Html += `<button class="btn btn-success btn-sm w-100 mt-2" onclick="requestTierUpgrade('${userId}', 'vip', 'Total spend of ₦60k+ met')">Request VIP Tier</button>`;
            } else {
                Html = `<p class="text-muted small mb-0 mt-2">Spend ₦60,000 total across orders to unlock VIP tier automatically.</p>`;
            }
        } else if (currentTier === 'vip') {
            Html = `<p class="text-muted small mb-0 mt-2">You are currently on VIP. Use the Reseller box above to unlock Reseller status anytime.</p>`;
        }

        ActionContainer.innerHTML = html;

    } catch (err) {
        Console.error("Error evaluating user tier:", err);
    }
}

Async function requestTierUpgrade(userId, requestedTier, details) {
    If (!confirm(`Are you sure you want to submit a request for ${requestedTier.toUpperCase()} status?`)) return;

    Try {
        Const userAuth = auth.currentUser;
        Const requestsRef = ref(database, 'tierRequests');
        Const newReqRef = push(requestsRef);
        
        Await set(newReqRef, {
            UserId: userId,
            UserEmail: userAuth ? userAuth.email : 'Unknown',
            CurrentTier: document.getElementById('user-current-tier-badge')?.innerText.toLowerCase() || 'regular',
            RequestedTier: requestedTier,
            Details: details,
            Status: 'pending',
            Timestamp: Date.now()
        });

        Alert("Tier upgrade request submitted successfully!");
        Location.reload();
    } catch (err) {
        Console.error("Error submitting upgrade request:", err);
        Alert("Failed to submit request.");
    }
}

Window.requestTierUpgrade = requestTierUpgrade;



/* =========================================================
   RESELLER MODAL & PAYMENT HANDLERS
========================================================= */

Const openResellerModalBtn = document.getElementById("openResellerModalBtn");
Const confirmResellerPaymentBtn = document.getElementById("confirmResellerPaymentBtn");
Const modalWalletBalance = document.getElementById("modalWalletBalance");
Const resellerModalMsg = document.getElementById("resellerModalMsg");

If (openResellerModalBtn) {
    OpenResellerModalBtn.addEventListener("click", async () => {
        Const user = auth.currentUser;
        If (!user) return;

        Try {
            Const userRef = ref(database, `users/${user.uid}`);
            Const snap = await get(userRef);
            Const data = snap.val() || {};
            Const currentWallet = Number(data.wallet || 0);

            If (modalWalletBalance) {
                ModalWalletBalance.textContent = formatNaira(currentWallet);
            }

            If (resellerModalMsg) {
                ResellerModalMsg.innerHTML = "";
            }

            Const myModal = new bootstrap.Modal(document.getElementById('resellerModal'));
            MyModal.show();
        } catch (err) {
            Console.error("Error opening reseller modal:", err);
        }
    });
}

If (confirmResellerPaymentBtn) {
    ConfirmResellerPaymentBtn.addEventListener("click", async () => {
        Const user = auth.currentUser;
        If (!user) return;

        If (resellerModalMsg) {
            ResellerModalMsg.innerHTML = `<div class="alert alert-info mb-0">Processing payment...</div>`;
        }

        Try {
            Const idToken = await user.getIdToken(true);

            // UPDATED TO MATCH YOUR reseller.js FILE ENDPOINT
            Const response = await fetch('/api/reseller', {
                Method: 'POST',
                Headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                },
                Body: JSON.stringify({ amount: 100000 })
            });

            Const textResponse = await response.text();
            Let result;
            Try {
                Result = JSON.parse(textResponse);
            } catch (e) {
                Console.error("Non-JSON response received:", textResponse);
                Throw new Error("Server returned an invalid response format.");
            }

            If (!response.ok || !result.success) {
                Throw new Error(result.message || "Failed to process reseller upgrade.");
            }

            If (resellerModalMsg) {
                ResellerModalMsg.innerHTML = `<div class="alert alert-success mb-0">${result.message}</div>`;
            }

            SetTimeout(() => {
                Location.reload();
            }, 2000);

        } catch (error) {
            Console.error("RESELLER UPGRADE ERROR:", error);
            If (resellerModalMsg) {
                ResellerModalMsg.innerHTML = `<div class="alert alert-danger mb-0">${error.message}</div>`;
            }
        }
    });
}



/* =========================================================
   AUTHENTICATION
========================================================= */

OnAuthStateChanged(
    Auth,
    Async (user) => {

        If (!user) {

            Window.location.href =
                "login.html";

            Return;

        }

        Await Promise.allSettled([

            LoadUserInformation(
                User
            ),

            LoadRecentOrders(
                User.uid
            ),

            LoadReferralInformation(
                User.uid
            ),

            EvaluateAndRenderUserTier(
                User.uid
            )

        ]);

    }
);



/* =========================================================
   LOGOUT
========================================================= */

If (logoutBtn) {

    LogoutBtn.addEventListener(
        "click",
        Async () => {

            Try {

                Await signOut(
                    Auth
                );


                Window.location.href =
                    "login.html";


            } catch (error) {

                Console.error(
                    "LOGOUT ERROR:",
                    Error
                );

            }

        }
    );

}
