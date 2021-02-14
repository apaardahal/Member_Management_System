const { router, check, validationResult } = require('../Config/Http');
const { Error } = require('../Config/Logs');
const QueryExecuator = require('../Database/QueryExe'),
    Exe = new QueryExecuator();

// Extracting Middleware
const isLoggedIn = require('../Middlewares/isLoggedIn');

// Dashboard if the Session has data set Else Login
router.get('/', isLoggedIn, (request, response) => {
    if (request.session.LoginInformation === undefined && request.session.UserInfromation != undefined) {
        response.render('login', { title: 'Login', layout: false });
    } else {
        const { UserName, LoggedIn } = request.session.LoginInformation;
        if (LoggedIn == true && request.session.LoginInformation.UserName == request.session.UserInfromation.UserName)
            response.redirect(`/Dashboard?UserName=${UserName}`);
        else
            response.redirect(`/Logout`);
    }
});

// Clears Up The Session
router.get('/Logout', (request, response) => {
    request.session.destroy((err) => {
        if (err) Error.log(err);
        response.redirect(`/`);
    });
});

// Redirects To Dashboard
router.get('/Dashboard', isLoggedIn, (request, response) => {
    const { UserName } = request.query;
    if (UserName.length != 0 && request.session.LoginInformation != undefined && request.session.UserInfromation != undefined) {
        if (UserName == request.session.LoginInformation.UserName && request.session.UserInfromation.UserName == UserName) {
            response.render('dashboard', {
                title: 'Dashboard',
                layout: 'main',
                data: { msg: `Welcome ${UserName}, Have a wonderful day!` }
            });
        } else
            response.redirect(`/Logout`);
    }
});

// Logins The User 
router.post('/Login', [
    check('UserName')
    .isLength({ min: 5, max: 20 })
    .withMessage('User Name must have 5-20 characters.'),
    check('Password')
    .isLength({ min: 8, max: 20 })
    .withMessage('Password must have 8-20 characters.')
], (request, response) => {
    // Check if Login Details Exists
    if (request.session.LoginInformation === undefined && request.session.UserInfromation === undefined) {
        // Storing Errors
        const errors = validationResult(request);
        if (errors.isEmpty()) {
            // Destructuring requestuest Body 
            const { UserName, Password } = request.body;
            // Validate Database
            Exe.queryExecuator('SELECT * FROM `user` WHERE UserName=? AND Password=?', [UserName, Password], (error, result) => {
                if (error) Error.log(error);
                if (request.length != 0 && result[0].UserName == UserName) {
                    request.session.LoginInformation = { UserName, LoggedIn: true };
                    request.session.UserInfromation = result[0];
                    response.redirect(`/Dashboard?UserName=${UserName}`);
                } else
                    response.render('login', {
                        title: 'Login',
                        layout: false,
                        errors: [{ msg: `Invalid Username or Password!` }],
                        data: request.body
                    });
            });
        } else {
            response.render('login', {
                title: 'Login',
                layout: false,
                errors: errors.array(),
                data: request.body
            });
        }
    } else response.redirect('/');
});

// Exporting Routeer to WebRoute Handler
module.exports = router;