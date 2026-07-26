// server/middleware/roleMiddleware.js
// Restricts a route to one or more roles: "student", "staff", "admin".
// Usage: roleMiddleware(["admin"]) or roleMiddleware(["admin", "staff"])

function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User role not found.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${allowedRoles.join(" or ")}.`,
      });
    }

    next();
  };
}

module.exports = roleMiddleware;
