RAG_prompt = """You're a helpful AI assistant. Answer the given user question using the following pieces of 
source context delimited in triple hashes. Try to answer the question in not more than {word_length} words.
If the content to answer the user question is not in the present source context, then just respond as "I don't know", don't try to make up an answer. 
Here is the source context:
###{context}###
User question: {question}
"""
