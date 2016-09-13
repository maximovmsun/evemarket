"use strict";

var React = require('react');
var ReactDOM = require('react-dom');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var IndexRoute = ReactRouter.IndexRoute;
var Route = ReactRouter.Route;
var hashHistory = ReactRouter.browserHistory;

ReactDOM.render(
    <Router history={ hashHistory }>
        <Route name="app" path="/" component={require('./components/app') }>
            <IndexRoute component={require('./components/AutocompleteTest') }/>
            <Route name="AutocompleteTest" path="/AutocompleteTest" component={require('./components/AutocompleteTest') }/>
            <Route path="*" component={require('./components/notFoundPage') }/>
        </Route>
    </Router>,
    document.getElementById('app')
);