/*
=================================
HKDMServices v1.0
Main JavaScript File
=================================
*/


// Wait until page loads

document.addEventListener("DOMContentLoaded", function () {


    console.log("HKDMServices loaded successfully");


    /*
    ===============================
    Smooth Scrolling
    ===============================
    */


    const links = document.querySelectorAll('a[href^="#"]');


    links.forEach(link => {


        link.addEventListener("click", function(e){


            const target = document.querySelector(
                this.getAttribute("href")
            );


            if(target){

                e.preventDefault();


                target.scrollIntoView({

                    behavior: "smooth"

                });

            }


        });


    });





    /*
    ===============================
    Mobile Navbar Close
    ===============================
    */


    const navLinks = document.querySelectorAll(
        ".navbar-nav .nav-link"
    );


    const navbarCollapse = document.querySelector(
        ".navbar-collapse"
    );


    navLinks.forEach(link => {


        link.addEventListener("click", () => {


            if(navbarCollapse.classList.contains("show")){


                new bootstrap.Collapse(
                    navbarCollapse
                ).hide();


            }


        });


    });





    /*
    ===============================
    Future Integrations
    ===============================

    Kinde Authentication
    Firebase Database
    Korapay Payment Gateway
    Render Background Jobs

    Will be added here.

    ===============================
    */


});
