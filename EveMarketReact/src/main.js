﻿"use strict";

var React = require('react');
var ReactDOM = require('react-dom');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var IndexRoute = ReactRouter.IndexRoute;
var Route = ReactRouter.Route;
var hashHistory = ReactRouter.hashHistory;

ReactDOM.render(
    <Router history={ItemUtil.getHistory() }>
        <Route name="app" path="/" component={require('./components/app') }>
            <IndexRoute component={require('./components/registration/index') }/>
            <Route name="login" path="/login" component={require('./components/login/login') }/>
            <Route path="*" component={require('./components/notFoundPage') }/>
        </Route>
    </Router>,
    document.getElementById('app')
);