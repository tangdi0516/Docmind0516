from langchain_openai import ChatOpenAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from ingestion import get_vectorstore

llm = ChatOpenAI(model="gpt-3.5-turbo")

def get_rag_chain(user_id: str):
    vectorstore = get_vectorstore()
    # PGVector supports metadata filtering directly
    retriever = vectorstore.as_retriever(search_kwargs={"filter": {"user_id": user_id}})
    
    from user_data_store import get_user_data
    user_data = get_user_data(user_id)
    system_prompt = user_data.get("system_prompt", "You are a helpful assistant.")
    
    # Append context placeholder if not present (though usually it's part of the template structure in langchain)
    # Actually, create_stuff_documents_chain expects the prompt to have {context} and {input}
    # So we need to ensure the user's prompt is used as the system message.
    
    # LangChain's create_stuff_documents_chain puts the documents into {context} variable.
    # We will construct the full system message here.
    
    full_system_prompt = (
        f"{system_prompt}\n\n"
        "{context}"
    )
    
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", full_system_prompt),
            ("human", "{input}"),
        ]
    )
    
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    
    return rag_chain

def query_rag(question: str, user_id: str):
    rag_chain = get_rag_chain(user_id)
    response = rag_chain.invoke({"input": question})
    return response["answer"]
