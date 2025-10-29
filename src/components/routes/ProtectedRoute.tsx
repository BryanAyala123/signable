import { Route, Redirect } from "react-router-dom";
import { useAuth } from "../../contexts/authContext";
import React from "react";

interface PrivateRouteProps {
    component: React.ComponentType<any>;
    path: string;
    exact?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
    component: Component,
    ...rest
}) => {
    const { currentUser, loading } = useAuth();

    if (loading) return null;

    return (
        <Route
        {...rest}
        render={(props) =>
            currentUser ? (
            <Component {...props} />
            ) : (
            <Redirect to="/" />
            )
        }
        />
    );
};

export default PrivateRoute;
