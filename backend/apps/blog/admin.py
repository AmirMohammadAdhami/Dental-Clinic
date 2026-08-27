from django import forms
from django.contrib import admin
from django.db import models
from .models import ArticleMedia, ArticleView, Article, Comment, FAQ, BeforeAfter
from .widgets import BlockEditorWidget


class ArticleMediaInline(admin.TabularInline):
    model = ArticleMedia
    extra = 0


class ArticleAdminForm(forms.ModelForm):
    """Custom form with BlockEditorWidget for content_blocks."""

    class Meta:
        model = Article
        fields = '__all__'
        widgets = {
            'content_blocks': BlockEditorWidget,
        }


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    form = ArticleAdminForm
    list_display = ('title', 'author', 'slug', 'is_published', 'view_count', 'created_at')
    list_filter = ('is_published', 'created_at')
    search_fields = ('title', 'slug', 'content')
    readonly_fields = ('slug', 'view_count', 'created_at', 'updated_at')
    raw_id_fields = ('author', 'category')
    inlines = [ArticleMediaInline]

    class Media:
        css = {'all': ('css/blog/admin-block-editor.css',)}
        js = ('js/blog/admin-block-editor.js',)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'article', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('content',)
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user', 'article')


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ('question', 'created_at')
    search_fields = ('question', 'answer_text')
    readonly_fields = ('created_at',)
    filter_horizontal = ('categories',)


@admin.register(BeforeAfter)
class BeforeAfterAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'description', 'created_at')
    search_fields = ('description',)
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('appointment',)


@admin.register(ArticleView)
class ArticleViewAdmin(admin.ModelAdmin):
    list_display = ('article', 'user', 'ip_address', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('article__title', 'ip_address')
    readonly_fields = ('created_at',)
    raw_id_fields = ('article', 'user')
