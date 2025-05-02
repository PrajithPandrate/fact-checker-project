from vertexai.preview.language_models import ChatModel
import vertexai

vertexai.init(project="aesthetic-root-463100-c7", location="us-central1")

try:
    model = ChatModel.from_pretrained("chat-bison@001")
    print("✅ Gemini model is accessible.")
except Exception as e:
    print("❌ Gemini model NOT accessible.")
    print(e)
