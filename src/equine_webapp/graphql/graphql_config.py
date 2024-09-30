# Copyright (c) 2023 Massachusetts Institute of Technology
# SPDX-License-Identifier: MIT
from ariadne import QueryType, MutationType, make_executable_schema, load_schema_from_path
import equine_webapp.graphql.query_resolvers
import equine_webapp.graphql.mutation_resolvers
from equine_webapp.utils import SERVER_CONFIG

type_defs = load_schema_from_path(SERVER_CONFIG.SCHEMA_PATH)

query = QueryType()
query.set_field("models", equine_webapp.graphql.query_resolvers.resolve_available_models)
query.set_field("modelSummary", equine_webapp.graphql.query_resolvers.resolve_model_summary)
query.set_field("getPrototypeSupportEmbeddings", equine_webapp.graphql.query_resolvers.resolve_get_protonet_support_embeddings)
query.set_field("dimensionalityReduction", equine_webapp.graphql.query_resolvers.resolve_dimensionality_reduction)
query.set_field("renderInferenceFeatureData", equine_webapp.graphql.query_resolvers.resolve_render_inference_feature_data)
query.set_field("renderSupportFeatureData", equine_webapp.graphql.query_resolvers.resolve_render_support_feature_data)

mutation = MutationType()
mutation.set_field("uploadFile", equine_webapp.graphql.mutation_resolvers.resolve_upload_file)
mutation.set_field("uploadModel", equine_webapp.graphql.mutation_resolvers.resolve_upload_model)
mutation.set_field("runInference", equine_webapp.graphql.mutation_resolvers.resolve_run_inference)
mutation.set_field("startTraining", equine_webapp.graphql.mutation_resolvers.resolve_train_model)

schema = make_executable_schema(type_defs, query, mutation)