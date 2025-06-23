import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.retrievers import WikipediaRetriever
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document
from typing import Any, Dict, List

class ResourceService:
    def __init__(self):
        self.vectorstore_db = None
        self.api_key = os.getenv("GROQ_API_KEY")
        self.last_retrieved_docs = []
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not set in the environment variables.")
        self.model = os.getenv("MODEL_NAME")

        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.uploaded_rag_folder_path = os.path.join(project_root, "uploaded_files")
        os.makedirs(self.uploaded_rag_folder_path, exist_ok=True)

    def initialize_resources(self, selected_file_paths: List[str]):
        """Initialize the vectorstore using selected files."""
        documents = self.load_documents(selected_file_paths)
        chunks = self.split_documents(documents)
        self.vectorstore_db = self.create_vectorstore(chunks)
        return {"message": "Resources initialized successfully."}

    def load_documents(self, file_paths: List[str]) -> List[Document]:
        """Load documents from the specified directory."""
        documents = []
        for file_path in file_paths:
            loader = PyPDFLoader(file_path)
            documents.extend(loader.load())
        print(f"Number of documents: {len(documents)}")
        return documents

    def split_documents(self, documents: List[Document], chunk_size: int = 1500, chunk_overlap: int = 100) -> List[Document]:
        """Split documents into chunks."""
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        chunks = text_splitter.split_documents(documents)
        print(f"Number of chunks: {len(chunks)}")
        return chunks

    def create_vectorstore(self, chunks: List[Document]) -> FAISS:
        """Create a vectorstore from document chunks."""
        model_kwargs = {'device': 'cpu'}
        encode_kwargs = {'normalize_embeddings': False}
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2", model_kwargs=model_kwargs, encode_kwargs=encode_kwargs)
        vectorstore_db = FAISS.from_documents(chunks, embeddings)
        return vectorstore_db

    def formatted_retrieve_docs(self, question: str, k: int = 3) -> str:
        """Retrieve relevant documents based on the input question."""
        if not self.vectorstore_db:
            raise ValueError("Vectorstore is not initialized. Please initialize resources first.")
        
        retriever = self.vectorstore_db.as_retriever(search_type="similarity", search_kwargs={'k': k})
        retrieved_docs = retriever.invoke(question)
        if not retrieved_docs:
            return "No relevant documents found."
        
        # Store the retrieved docs for later citation mapping
        self.last_retrieved_docs = retrieved_docs
        formatted = [
            f"Source ID: {i}\n" +
            f"Context source: {doc.metadata.get('source', 'N/A')}\nContext page content: {doc.page_content}"
            for i, doc in enumerate(retrieved_docs)
        ]
        return "\n\n" + "\n\n".join(formatted)

    def map_citations_to_metadata(self, citations: List[int]) -> List[Dict[str, Any]]:
        """Map citation IDs back to document metadata."""
        mapped_citations = []
        for citation_id in citations:
            if citation_id < 0 or citation_id >= len(self.last_retrieved_docs):
                # Invalid citation ID
                mapped_citations.append({
                    "source_id": citation_id,
                    "error": "Invalid citation ID"
                })
                continue
            doc = self.last_retrieved_docs[citation_id]
            mapped_citations.append({
                "source_id": citation_id,
                "page": doc.metadata.get('page', 'N/A'),
                "page_label": doc.metadata.get('page_label', 'N/A'),
                "source": doc.metadata.get('source', 'N/A'),
                "page_content": doc.page_content
            })
        return mapped_citations
    
    def wikipedia_retriever(self, question: str, k: int = 3) -> str:
        """Retrieve relevant chunks from wikipedia based on the input question."""
        wikipedia_retriever = WikipediaRetriever(top_k_results=k, doc_content_chars_max=3000)
        retrieved_docs = wikipedia_retriever.invoke(question)

        # Store the retrieved docs for later citation mapping
        self.last_retrieved_docs = retrieved_docs
        formatted = [
            f"Source ID: {i}\n" +
            f"Context source: {doc.metadata.get('source', 'N/A')}\nContext page content: {doc.page_content}"
            for i, doc in enumerate(retrieved_docs)
        ]
        return "\n\n" + "\n\n".join(formatted)
