"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function DocsPage() {
  return (
    <div className="swagger-wrap">
      <SwaggerUI
        url="/api/openapi"
        persistAuthorization
        docExpansion="list"
        tryItOutEnabled
      />
    </div>
  );
}
