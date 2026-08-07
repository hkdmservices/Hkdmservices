const loginButtons = document.querySelectorAll(".login-btn");
const registerButtons = document.querySelectorAll(".register-btn");

loginButtons.forEach(button => {

    button.addEventListener("click", async (e) => {

        e.preventDefault();

        await kinde.login();

    });

});

registerButtons.forEach(button => {

    button.addEventListener("click", async (e) => {

        e.preventDefault();

        await kinde.register();

    });

});
