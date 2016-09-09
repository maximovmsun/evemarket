"use strict";

//var React = require('react');

var ReactRouter = require('react-router');
var Route = ReactRouter.Route;

var IndexRoute = ReactRouter.IndexRoute;

var routes = (
    <Route name="app" path="/" component={require('./components/app') }>
        <IndexRoute component={require('./components/registration/index') }/>
        <Route name="login" path="/login" component={require('./components/login/login') }/>
        <Route path="*" component={require('./components/notFoundPage') }/>
    </Route>
);

module.exports = routes;