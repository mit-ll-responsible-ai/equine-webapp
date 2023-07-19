from ariadne import QueryType, MutationType, make_executable_schema, load_schema_from_path
import server.graphql.query_resolvers
import server.graphql.mutation_resolvers
from server.utils import SERVER_CONFIG

type_defs = load_schema_from_path(SERVER_CONFIG.SCHEMA_PATH)

query = QueryType()
query.set_field("models", server.graphql.query_resolvers.resolve_available_models)
query.set_field("modelSummary", server.graphql.query_resolvers.resolve_model_summary)
query.set_field("getPrototypeSupportEmbeddings", server.graphql.query_resolvers.resolve_get_protonet_support_embeddings)
query.set_field("dimensionalityReduction", server.graphql.query_resolvers.resolve_dimensionality_reduction)
query.set_field("renderInferenceFeatureData", server.graphql.query_resolvers.resolve_render_inference_feature_data)
query.set_field("renderSupportFeatureData", server.graphql.query_resolvers.resolve_render_support_feature_data)

mutation = MutationType()
mutation.set_field("uploadFile", server.graphql.mutation_resolvers.resolve_upload_file)
mutation.set_field("uploadModel", server.graphql.mutation_resolvers.resolve_upload_model)
mutation.set_field("runInference", server.graphql.mutation_resolvers.resolve_run_inference)
mutation.set_field("startTraining", server.graphql.mutation_resolvers.resolve_train_model)

schema = make_executable_schema(type_defs, query, mutation)