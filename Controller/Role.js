const { express, check, validationResult, queryBox, Exe, Error, isLoggedIn, AllowAccess, SELECT_LIMIT } = require('../Config/Http'),
    roleRouter = express.Router();

// Return List of All Roles as Json Dataset
roleRouter.get('/', isLoggedIn, AllowAccess, (request, response) => {
    let page = parseInt(request.query.page) || 1;
    if (page != null) {
        const { paginate, count } = require('../Database/ExtraQuery'),
            offset = (page - 1) * parseInt(SELECT_LIMIT);
        count(queryBox.Role.Select.Count, null, (result) => {
            if (response)
                paginate(request.baseUrl, request.url, page, queryBox.Role.Select.Paginate, [parseInt(SELECT_LIMIT), parseInt(offset)], result.result.Total_Count, (res) => {
                    request.session.RoleInformation = res.response;
                    response.render('Role/role', {
                        title: 'Roles',
                        layout: 'main',
                        link: "/Role",
                        UserInfromation: request.session.UserInfromation,
                        RoleInformation: res.response
                    });
                });
        });
    } else {
        response.render('Role/role', {
            title: 'Roles',
            layout: 'main',
            link: "/Role",
            UserInfromation: request.session.UserInfromation,
            RoleInformation: {
                success: false
            }
        });
    }
});

// Role Add Edit GET request
roleRouter.get('/action/:Task', isLoggedIn, AllowAccess, (request, response) => {
    // Extracting to define the condition
    const { Task } = request.params;
    const { Role } = request.query;
    // Check if task is null
    if (Task != null) {
        // Check if task is add or edit
        if (Task == 'edit') {
            // check if Role is passed
            if (Role != null) {
                // Fetch Role details matching role and send it as well
                Exe.queryExecuator(queryBox.Role.Select.ById, parseInt(Role), (editError, editResult) => {
                    if (editError != null) Error.log(editError);
                    request.session.EditRole = editResult[0];
                    // Check if Result is not null
                    if (editResult) response.render('Role/addEditRole', {
                        title: 'Roles',
                        layout: 'main',
                        pageType: Task,
                        subTitle: "Edit",
                        link: "/Role",
                        UserInfromation: request.session.UserInfromation,
                        EditRole: editResult[0]
                    });
                })
            } else response.redirect('/Role');
        } else if (Task == 'add') {
            // Render Add form
            response.render('Role/addEditRole', {
                title: 'Roles',
                layout: 'main',
                pageType: Task,
                subTitle: "Add",
                link: "/Role",
                UserInfromation: request.session.UserInfromation,
            });
        } else response.redirect('/Role');
    } else response.redirect('/Role');
});

// Role Add Edit POST request
roleRouter.post('/Entry', [
    check('Task')
    .notEmpty()
    .withMessage('Task is Required to set Role!'),
    check('Name')
    .notEmpty()
    .withMessage('Name is Required to set Role!')
], isLoggedIn, AllowAccess, (request, response) => {
    // Extracted Elements from request body
    let { Task, Name, Remarks } = request.body;
    const errors = validationResult(request);
    if (errors.isEmpty()) {
        if (Task == 'add') {
            // Executing Sql Query
            Exe.queryExecuator(queryBox.Role.Insert + `('${Name}','${Remarks}')`, null, (error, result) => {
                if (error != null) Error.log(error);
                if (result) response.redirect('/Role');
            });
        } else if (Task == 'edit') {
            const { Role } = request.body;
            // Perform edit operation
            Exe.queryExecuator(queryBox.Role.Update, [`${Name}`, `${Remarks}`, parseInt(Role)], (error, result) => {
                if (error != null) Error.log(error);
                if (result) response.redirect('/Role');
            });
        } else response.render('Role/role', {
            title: 'Roles',
            layout: 'main',
            link: "/Role",
            errors: [{ msg: `Invalid Request, Try again later!` }],
            UserInfromation: request.session.UserInfromation,
            EditRole: request.session.EditRole,
            RoleInformation: request.session.RoleInformation
        });
    } else
        response.render('Role/role', {
            title: 'Roles',
            layout: 'main',
            link: "/Role",
            errors: errors.array(),
            UserInfromation: request.session.UserInfromation,
            EditRole: request.session.EditRole,
            RoleInformation: request.session.RoleInformation
        });
});

roleRouter.post('/remove/:Role', isLoggedIn, AllowAccess, (request, response) => {
    const { Role } = request.params;
    if (Role != null) {
        Exe.queryExecuator(queryBox.Role.Delete, parseInt(Role), (error, result) => {
            if (error != null) Error.log(error);
            // Check if Result is not null
            if (result) response.redirect('/Role');
        });
    } else response.render('Role/role', {
        title: 'Roles',
        layout: 'main',
        link: "/Role",
        errors: [{ msg: `Invalid Delete Request, Try again later!` }],
        UserInfromation: request.session.UserInfromation,
        EditRole: request.session.EditRole,
        RoleInformation: request.session.RoleInformation
    });
});
module.exports = roleRouter;